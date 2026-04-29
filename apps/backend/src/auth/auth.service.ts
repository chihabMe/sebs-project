import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getJwtSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET', developmentFallback: string) {
    const configured = this.configService.get<string>(name);
    if (configured) return configured;
    if (process.env.NODE_ENV !== 'production') return developmentFallback;
    throw new Error(`${name} must be configured in production`);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.logger.warn(`registration_failed duplicate_email email=${email}`);
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name.trim(),
        role: dto.role || 'USER',
      },
    });

    this.logger.log(`registration_succeeded userId=${user.id} email=${user.email} role=${user.role}`);

    const tokens = await this.getTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { tags: true }
    });
    if (!user) {
      this.logger.warn(`login_failed reason=user_not_found email=${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      this.logger.warn(`login_failed reason=banned_user userId=${user.id} email=${email}`);
      throw new ForbiddenException('Your account has been banned');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      this.logger.warn(`login_failed reason=invalid_password userId=${user.id} email=${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`login_succeeded userId=${user.id} email=${user.email} role=${user.role}`);

    const tokens = await this.getTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getJwtSecret('JWT_REFRESH_SECRET', 'refreshsecretfallback'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) throw new UnauthorizedException('User not found');
      if (user.isBanned) throw new ForbiddenException('Your account has been banned');

      const tokens = await this.getTokens(user.id, user.role);
      return tokens;
    } catch (e) {
      if (e instanceof ForbiddenException || e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tags: true },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      tags: user.tags,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    };
  }

  async getTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, role },
        {
          secret: this.getJwtSecret('JWT_SECRET', 'supersecretfallback'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { id: userId },
        {
          secret: this.getJwtSecret('JWT_REFRESH_SECRET', 'refreshsecretfallback'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
