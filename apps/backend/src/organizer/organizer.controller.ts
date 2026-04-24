import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Organizer')
@Controller('organizer')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Get('events/:eventId/attendees')
  @ApiOperation({ summary: 'Get all attendees for an event' })
  async getEventAttendees(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.organizerService.getEventAttendees(eventId, userId, userRole);
    return { success: true, data };
  }

  @Patch('bookings/:bookingId/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body('status') status: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.organizerService.updateBookingStatus(bookingId, status, userId, userRole);
    return { success: true, message: `Booking ${status.toLowerCase()} successfully`, data };
  }

  @Delete('bookings/:bookingId')
  @ApiOperation({ summary: 'Remove an attendee' })
  async removeAttendee(
    @Param('bookingId') bookingId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    await this.organizerService.removeAttendee(bookingId, userId, userRole);
    return { success: true, message: 'Attendee removed successfully' };
  }

  @Post('events/:eventId/invite')
  @ApiOperation({ summary: 'Generate invitation link' })
  async generateInviteLink(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.organizerService.generateInviteLink(eventId, userId, userRole);
    return { success: true, data };
  }
}
