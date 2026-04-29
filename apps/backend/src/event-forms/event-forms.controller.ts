import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EventFormsService } from './event-forms.service';
import { UpdateEventFormDto } from './dto/event-form.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Event Forms')
@Controller('event-forms')
export class EventFormsController {
  constructor(private readonly eventFormsService: EventFormsService) {}

  @Get(':eventId')
  @ApiOperation({ summary: 'Get event form questions' })
  async getForm(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    const data = await this.eventFormsService.getForm(eventId);
    return { success: true, data };
  }

  @Post(':eventId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @ApiOperation({ summary: 'Update event form questions' })
  async updateForm(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpdateEventFormDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const data = await this.eventFormsService.updateForm(eventId, dto, userId, userRole);
    return { success: true, message: 'Event form updated successfully', data };
  }
}
