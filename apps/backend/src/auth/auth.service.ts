import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private getJwtSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET', developmentFallback: string) {
    const configured = this.configService.get<string>(name);
    if (configured) return configured;
    if (process.env.NODE_ENV !== 'production') return developmentFallback;
    throw new Error(`${name} must be configured in production`);
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getFrontendUrl() {
    const configured = this.configService.get<string>('FRONTEND_PUBLIC_URL') || this.configService.get<string>('WEB_APP_URL');
    if (configured) return configured.replace(/\/+$/, '');
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:5173';
    throw new Error('FRONTEND_PUBLIC_URL or WEB_APP_URL must be configured in production');
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.isBanned) {
      this.logger.warn(`password_reset_requested no_eligible_user email=${email}`);
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetRequestedAt: new Date(),
      },
    });

    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailService.sendPasswordResetEmail(user, resetUrl);
    this.logger.log(`password_reset_email_queued userId=${user.id} email=${email}`);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const user = await this.prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });

    if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    });

    this.logger.log(`password_reset_succeeded userId=${user.id} email=${user.email}`);
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
