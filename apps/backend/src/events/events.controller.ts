import { 
  BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, 
  Query, UseInterceptors, UploadedFile, ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { extname } from 'path';
import { memoryStorage } from 'multer';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { EventsQueryDto } from './dto/events-query.dto';
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

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new event' })
  async create(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Body() createEventDto: CreateEventDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const imageUrl = file ? await this.cloudinaryService.uploadImage(file, 'eventify/events') : undefined;
    const event = await this.eventsService.create(userId, userRole, createEventDto, imageUrl);
    return { success: true, message: 'Event created successfully', data: event };
  }

  @Get()
  @ApiOperation({ summary: 'Get list of events (Public)' })
  async findAll(@Query() query: EventsQueryDto) {
    const result = await this.eventsService.findAll(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get('recommended')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get recommended events for user' })
  async getRecommended(@GetUser('id') userId: string) {
    const events = await this.eventsService.getRecommended(userId);
    return { success: true, data: events };
  }

  @Get('organizer')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @ApiOperation({ summary: 'Get events for organizer' })
  async findOrganizerEvents(@GetUser('id') userId: string) {
    const events = await this.eventsService.findOrganizerEvents(userId);
    return { success: true, data: events };
  }

  @Get(':id/manage')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @ApiOperation({ summary: 'Get event details for organizer/admin management' })
  async findOneForManager(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const event = await this.eventsService.findOneForManager(id, userId, userRole);
    return { success: true, data: event };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const event = await this.eventsService.findOne(id);
    return { success: true, data: event };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const imageUrl = file ? await this.cloudinaryService.uploadImage(file, 'eventify/events') : undefined;
    const event = await this.eventsService.update(id, userId, userRole, updateEventDto, imageUrl);
    return { success: true, message: 'Event updated successfully', data: event };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @ApiOperation({ summary: 'Delete an event' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    await this.eventsService.remove(id, userId, userRole);
    return { success: true, message: 'Event deleted successfully' };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @ApiOperation({ summary: 'Update event status' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEventStatusDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string
  ) {
    const event = await this.eventsService.updateStatus(id, dto.status, userId, userRole);
    return { success: true, message: 'Event status updated', data: event };
  }

}
