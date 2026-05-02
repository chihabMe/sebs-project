import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateUserByAdminDto, UpdateUserByAdminDto } from './dto/admin.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { PendingEventsQueryDto } from './dto/pending-events-query.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() dto: CreateUserByAdminDto, @GetUser('id') adminId: string) {
    const user = await this.adminService.createUser(dto, adminId);
    return { success: true, message: 'User created successfully', data: user };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query() query: AdminUsersQueryDto) {
    const users = await this.adminService.getUsers(query);
    return { success: true, data: users };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user status or role' })
  async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateUserByAdminDto,
    @GetUser('id') adminId: string,
  ) {
    const user = await this.adminService.updateUser(id, data, adminId);
    return { success: true, message: 'User updated successfully', data: user };
  }

  @Get('pending-events')
  @ApiOperation({ summary: 'Get pending events' })
  async getPendingEvents(@Query() query: PendingEventsQueryDto) {
    const events = await this.adminService.getPendingEvents(query);
    return { success: true, data: events };
  }

  @Patch('approve-event/:id')
  @ApiOperation({ summary: 'Approve an event' })
  async approveEvent(@Param('id', new ParseUUIDPipe()) id: string, @GetUser('id') adminId: string) {
    const event = await this.adminService.approveEvent(id);
    return { success: true, message: 'Event approved successfully', data: event };
  }

  @Patch('reject-event/:id')
  @ApiOperation({ summary: 'Reject a pending event' })
  async rejectEvent(@Param('id', new ParseUUIDPipe()) id: string, @GetUser('id') adminId: string) {
    const event = await this.adminService.rejectEvent(id, adminId);
    return { success: true, message: 'Event rejected successfully', data: event };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return { success: true, data: stats };
  }
}
