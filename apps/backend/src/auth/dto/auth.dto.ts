import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@sebs/shared';

const strongPasswordMessage = 'Password must be at least 12 characters and include uppercase, lowercase, number, symbol, and no spaces';
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{12,}$/;

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 12 })
  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['USER', 'ORGANIZER'], required: false })
  @IsOptional()
  @IsEnum(['USER', 'ORGANIZER'])
  role?: Extract<Role, 'USER' | 'ORGANIZER'>;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'a-secure-reset-token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 12 })
  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentStrongPass123!' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 12 })
  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  newPassword: string;
}
