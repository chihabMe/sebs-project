import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@GetUser('id') userId: string) {
    const user = await this.usersService.getProfile(userId);
    return { success: true, data: user };
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@GetUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { success: true, message: 'Profile updated successfully', data: user };
  }

  @Get('attendance')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user attendance history' })
  async getAttendanceHistory(@GetUser('id') userId: string) {
    const history = await this.usersService.getAttendanceHistory(userId);
    return { success: true, data: history };
  }

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public profile of a user' })
  async getPublicProfile(@Param('userId') userId: string) {
    const data = await this.usersService.getPublicProfile(userId);
    return { success: true, data };
  }
}
