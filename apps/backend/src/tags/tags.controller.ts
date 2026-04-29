import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  async findAll() {
    const tags = await this.tagsService.findAll();
    return { success: true, data: tags };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  async create(@Body() createTagDto: CreateTagDto, @GetUser('id') adminId: string) {
    const tag = await this.tagsService.create(createTagDto, adminId);
    return { success: true, message: 'Tag created successfully', data: tag };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a tag (Admin only)' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @GetUser('id') adminId: string) {
    await this.tagsService.remove(id, adminId);
    return { success: true, message: 'Tag deleted successfully' };
  }
}
