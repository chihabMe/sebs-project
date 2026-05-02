import { Controller, Get, Patch, Body, Param, UseGuards, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException, Delete, Res, Post, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { UsersService } from './users.service';
import { DeleteProfileDto, FollowBookingNotificationsDto, UpdateProfileDto, UserFollowingQueryDto, UserSearchQueryDto } from './dto/user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../common/services/cloudinary.service';

const imageUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

    if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extname(file.originalname).toLowerCase())) {
      cb(null, true);
      return;
    }

    cb(new BadRequestException('Only JPG, PNG, WebP, or GIF images up to 5 MB are allowed'), false);
  },
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private cookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
      maxAge,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@GetUser('id') userId: string) {
    const user = await this.usersService.getProfile(userId);
    return { success: true, data: user };
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @GetUser('id') userId: string, 
    @GetUser('role') userRole: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const avatarUrl = file ? await this.cloudinaryService.uploadImage(file, 'eventify/avatars') : undefined;
    const user = await this.usersService.updateProfile(userId, userRole, dto, avatarUrl);
    return { success: true, message: 'Profile updated successfully', data: user };
  }

  @Get('attendance')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user attendance history' })
  async getAttendanceHistory(@GetUser('id') userId: string) {
    const history = await this.usersService.getAttendanceHistory(userId);
    return { success: true, data: history };
  }

  @Get('search')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Search normal users to follow' })
  async searchUsers(
    @GetUser('id') userId: string,
    @Query() query: UserSearchQueryDto,
  ) {
    const result = await this.usersService.searchUsers(userId, query.query, query.page, query.limit);
    return { success: true, data: result.data, meta: result.meta };
  }

  @Post(':userId/follow')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
  ) {
    await this.usersService.followUser(userId, userRole, targetUserId);
    return { success: true, message: 'User followed successfully' };
  }

  @Delete(':userId/follow')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
  ) {
    await this.usersService.unfollowUser(userId, userRole, targetUserId);
    return { success: true, message: 'User unfollowed successfully' };
  }

  @Patch('settings/notify-followers-bookings')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Toggle notifications to followers when user books an event' })
  async toggleFollowBookingNotifications(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Body() dto: FollowBookingNotificationsDto,
  ) {
    const data = await this.usersService.updateFollowBookingNotifications(userId, userRole, dto.notifyFollowersOnBooking);
    return { success: true, message: 'Setting updated successfully', data };
  }

  @Get('notifications')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(@GetUser('id') userId: string) {
    const notifications = await this.usersService.getNotifications(userId);
    return { success: true, data: notifications };
  }

  @Get('following')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get users and organizers followed by current user' })
  async getFollowing(
    @GetUser('id') userId: string,
    @Query() query: UserFollowingQueryDto,
  ) {
    const result = await this.usersService.getFollowing(userId, query.page, query.limit);
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public profile of a user' })
  async getPublicProfile(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.usersService.getPublicProfile(userId);
    return { success: true, data };
  }

  @Delete('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete current user account with password confirmation' })
  async deleteProfile(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Body() dto: DeleteProfileDto,
    @Res() res: Response,
  ) {
    await this.usersService.deleteProfile(userId, userRole, dto.password);
    res.clearCookie('accessToken', this.cookieOptions(0));
    res.clearCookie('refreshToken', this.cookieOptions(0));
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  }
}
