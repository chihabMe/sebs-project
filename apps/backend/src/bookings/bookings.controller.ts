import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book tickets for an event' })
  async create(
    @GetUser('id') userId: string,
    @Body() createBookingDto: CreateBookingDto,
    @Query('token') token?: string
  ) {
    const booking = await this.bookingsService.create(userId, createBookingDto, token);
    return {
      success: true,
      message: booking.status === 'CONFIRMED' ? 'Booking confirmed' : 'Booking request submitted',
      data: booking
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings' })
  async findMy(@GetUser('id') userId: string) {
    const bookings = await this.bookingsService.findMy(userId);
    return { success: true, data: bookings };
  }

  @Get(':id/ticket')
  @ApiOperation({ summary: 'Download ticket PDF' })
  async getTicket(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.bookingsService.getTicket(id, userId, userRole);
    return { success: true, data };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(@Param('id') id: string, @GetUser('id') userId: string) {
    const booking = await this.bookingsService.cancel(id, userId);
    return { success: true, message: 'Booking cancelled successfully', data: booking };
  }

  @Get('status/:eventId')
  @ApiOperation({ summary: 'Check booking status for an event' })
  async checkStatus(@Param('eventId') eventId: string, @GetUser('id') userId: string) {
    const data = await this.bookingsService.checkStatus(eventId, userId);
    return { success: true, data };
  }
}
