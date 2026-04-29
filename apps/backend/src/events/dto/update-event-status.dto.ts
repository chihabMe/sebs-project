import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, type EventStatus as EventStatusType } from '@sebs/shared';
import { IsEnum } from 'class-validator';

export class UpdateEventStatusDto {
  @ApiProperty({ enum: EventStatus })
  @IsEnum(EventStatus)
  status: EventStatusType;
}
