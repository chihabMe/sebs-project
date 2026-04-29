import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateBookingQueryDto {
  @ApiPropertyOptional({ description: 'Invitation token UUID for direct confirm flow' })
  @IsOptional()
  @IsUUID()
  token?: string;
}
