import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@sebs/shared';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserByAdminDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
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
