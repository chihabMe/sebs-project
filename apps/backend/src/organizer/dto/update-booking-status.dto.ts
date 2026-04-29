import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, type BookingStatus as BookingStatusType } from '@sebs/shared';
import { IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED] })
  @IsEnum(BookingStatus)
  status: BookingStatusType;
}
