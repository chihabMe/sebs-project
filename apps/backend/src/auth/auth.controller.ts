import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
  Get,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  private cookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
      maxAge,
    };
  }

  private setTokensInCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, this.cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    this.setTokensInCookies(res, accessToken, refreshToken);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          tags: []
        },
        token: accessToken,
      },
    });
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    this.setTokensInCookies(res, accessToken, refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          tags: user.tags
        },
        token: accessToken,
      },
    });
  }

  @Post('admin/login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login administrator' })
  async adminLogin(@Body() dto: LoginDto, @Res() res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    if (user.role !== 'ADMIN') {
      this.logger.warn(`admin_login_failed reason=non_admin userId=${user.id} email=${user.email} role=${user.role}`);
      throw new ForbiddenException('Administrator access required');
    }

    this.logger.log(`admin_login_succeeded userId=${user.id} email=${user.email}`);

    this.setTokensInCookies(res, accessToken, refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Administrator logged in successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          tags: user.tags,
        },
        token: accessToken,
      },
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

    const tokens = await this.authService.refresh(refreshToken);
    this.setTokensInCookies(res, tokens.accessToken, tokens.refreshToken);
    
    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { token: tokens.accessToken }
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Res() res: Response) {
    res.clearCookie('accessToken', this.cookieOptions(0));
    res.clearCookie('refreshToken', this.cookieOptions(0));
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  @Get('session')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current authenticated session' })
  async session(@GetUser() user: { id: string; role: string }) {
    const sessionUser = await this.authService.getAuthenticatedUser(user.id);
    return { success: true, data: sessionUser };
  }

  @Get('admin/session')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get current authenticated admin session' })
  async adminSession(@GetUser() user: { id: string; role: string }) {
    const sessionUser = await this.authService.getAuthenticatedUser(user.id);
    return {
      success: true,
      data: {
        user: sessionUser,
        portal: 'admin',
      },
    };
  }
}
