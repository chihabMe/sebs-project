import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() dto: any) {
    const user = await this.adminService.createUser(dto);
    return { success: true, message: 'User created successfully', data: user };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers() {
    const users = await this.adminService.getUsers();
    return { success: true, data: users };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user status or role' })
  async updateUser(@Param('id') id: string, @Body() data: any) {
    const user = await this.adminService.updateUser(id, data);
    return { success: true, message: 'User updated successfully', data: user };
  }

  @Get('pending-events')
  @ApiOperation({ summary: 'Get pending events' })
  async getPendingEvents() {
    const events = await this.adminService.getPendingEvents();
    return { success: true, data: events };
  }

  @Patch('approve-event/:id')
  @ApiOperation({ summary: 'Approve an event' })
  async approveEvent(@Param('id') id: string) {
    const event = await this.adminService.approveEvent(id);
    return { success: true, message: 'Event approved successfully', data: event };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return { success: true, data: stats };
  }
}
