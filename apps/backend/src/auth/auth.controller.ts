import { Controller, Post, Body, Res, Req, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setTokensInCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
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
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}
