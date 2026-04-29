import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEventFormDto } from './dto/event-form.dto';

@Injectable()
export class EventFormsService {
  constructor(private prisma: PrismaService) {}

  async getForm(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.eventFormQuestion.findMany({ where: { eventId } });
  }

  async updateForm(eventId: string, dto: UpdateEventFormDto, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Unauthorized');

    await this.prisma.eventFormQuestion.deleteMany({ where: { eventId } });
    await this.prisma.eventFormQuestion.createMany({
      data: dto.questions.map(q => ({
        ...q,
        eventId,
      })),
    });

    return this.prisma.eventFormQuestion.findMany({ where: { eventId } });
  }
}
