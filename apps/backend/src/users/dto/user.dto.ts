import { IsString, IsOptional, IsArray, IsUrl, MaxLength, MinLength, IsBoolean, IsBooleanString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, description: 'Only USER role can update this setting' })
  @IsOptional()
  @IsBooleanString()
  notifyFollowersOnBooking?: string;
}

export class DeleteProfileDto {
  @ApiProperty({ example: 'CurrentStrongPass123!' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class UserSearchQueryDto extends PaginationQueryDto {
  @ApiProperty({ required: false, example: 'sara' })
  @IsOptional()
  @IsString()
  query?: string;
}

export class UserFollowingQueryDto extends PaginationQueryDto {}

export class FollowBookingNotificationsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  notifyFollowersOnBooking: boolean;
}
