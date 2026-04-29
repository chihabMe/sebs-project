import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AttendeesQueryDto } from './dto/attendees-query.dto';
import { BulkBookingStatusDto } from './dto/bulk-booking-status.dto';
import { BulkRemoveAttendeesDto } from './dto/bulk-remove-attendees.dto';

@ApiTags('Organizer')
@Controller('organizer')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get organizer dashboard stats' })
  async getDashboardStats(@GetUser('id') userId: string) {
    const data = await this.organizerService.getOrganizerDashboardStats(userId);
    return { success: true, data };
  }

  @Get('events/:eventId/attendees')
  @ApiOperation({ summary: 'Get all attendees for an event' })
  async getEventAttendees(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Query() query: AttendeesQueryDto
  ) {
    const data = await this.organizerService.getEventAttendees(eventId, userId, userRole, query);
    return { success: true, data };
  }

  @Patch('bookings/:bookingId/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateBookingStatus(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.organizerService.updateBookingStatus(bookingId, dto.status, userId, userRole);
    return { success: true, message: `Booking ${dto.status.toLowerCase()} successfully`, data };
  }

  @Patch('events/:eventId/bookings/status')
  @ApiOperation({ summary: 'Bulk update booking statuses for an event' })
  async bulkUpdateBookingStatuses(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: BulkBookingStatusDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const data = await this.organizerService.bulkUpdateBookingStatus(eventId, dto.bookingIds, dto.status, userId, userRole);
    return { success: true, message: 'Booking statuses updated', data };
  }

  @Delete('bookings/:bookingId')
  @ApiOperation({ summary: 'Remove an attendee' })
  async removeAttendee(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    await this.organizerService.removeAttendee(bookingId, userId, userRole);
    return { success: true, message: 'Attendee removed successfully' };
  }

  @Post('events/:eventId/bookings/remove')
  @ApiOperation({ summary: 'Bulk remove attendees from an event' })
  async bulkRemoveAttendees(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: BulkRemoveAttendeesDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const data = await this.organizerService.bulkRemoveAttendees(eventId, dto.bookingIds, userId, userRole);
    return { success: true, message: 'Attendees removed', data };
  }

  @Post('events/:eventId/invite')
  @ApiOperation({ summary: 'Generate invitation link' })
  async generateInviteLink(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.organizerService.generateInviteLink(eventId, userId, userRole);
    return { success: true, data };
  }

  @Post('events/:eventId/invite/rotate')
  @ApiOperation({ summary: 'Rotate invitation link token' })
  async rotateInviteLink(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    const data = await this.organizerService.rotateInviteLink(eventId, userId, userRole);
    return { success: true, data };
  }
}
