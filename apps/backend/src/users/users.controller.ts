import { Controller, Get, Patch, Body, Param, UseGuards, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';

const imageUploadOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      return cb(null, `${Date.now()}-${randomName}${extname(file.originalname)}`);
    }
  }),
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
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @GetUser('id') userId: string, 
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const avatarPath = file ? `/uploads/${file.filename}` : undefined;
    const user = await this.usersService.updateProfile(userId, dto, avatarPath);
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
  async getPublicProfile(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.usersService.getPublicProfile(userId);
    return { success: true, data };
  }
}
