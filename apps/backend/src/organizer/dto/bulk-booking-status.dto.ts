import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, type BookingStatus as BookingStatusType } from '@sebs/shared';
import { ArrayMinSize, IsArray, IsEnum, IsUUID } from 'class-validator';

export class BulkBookingStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  bookingIds: string[];

  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatusType;
}
