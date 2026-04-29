import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateTagDto, actorId?: string) {
    const existingTag = await this.prisma.tag.findUnique({ where: { name: dto.name } });
    if (existingTag) throw new BadRequestException('Tag already exists');
    const tag = await this.prisma.tag.create({ data: { name: dto.name } });
    this.logger.log(JSON.stringify({ scope: 'admin_audit', action: 'create_tag', actorId: actorId ?? 'unknown', target: tag.id }));
    return tag;
  }

  async remove(id: string, actorId?: string) {
    try {
      await this.prisma.tag.delete({ where: { id } });
      this.logger.log(JSON.stringify({ scope: 'admin_audit', action: 'delete_tag', actorId: actorId ?? 'unknown', target: id }));
    } catch (e) {
      throw new NotFoundException('Tag not found');
    }
  }
}
