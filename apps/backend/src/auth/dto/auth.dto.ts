import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@sebs/shared';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
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

  @ApiProperty({ example: 'newPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
