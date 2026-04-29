import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@sebs/shared';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const strongPasswordMessage = 'Password must be at least 12 characters and include uppercase, lowercase, number, symbol, and no spaces';
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{12,}$/;

export class CreateUserByAdminDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 12 })
  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ['USER', 'ORGANIZER', 'ADMIN'], required: false })
  @IsOptional()
  @IsEnum(['USER', 'ORGANIZER', 'ADMIN'])
  role?: Role;
}

export class UpdateUserByAdminDto {
  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ enum: ['USER', 'ORGANIZER', 'ADMIN'], required: false })
  @IsOptional()
  @IsEnum(['USER', 'ORGANIZER', 'ADMIN'])
  role?: Role;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}
