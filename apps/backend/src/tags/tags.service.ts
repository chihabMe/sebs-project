import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateTagDto) {
    const existingTag = await this.prisma.tag.findUnique({ where: { name: dto.name } });
    if (existingTag) throw new BadRequestException('Tag already exists');
    return this.prisma.tag.create({ data: { name: dto.name } });
  }

  async remove(id: string) {
    try {
      await this.prisma.tag.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Tag not found');
    }
  }
}
