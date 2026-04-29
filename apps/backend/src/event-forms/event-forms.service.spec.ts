import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventFormsService } from './event-forms.service';

describe('EventFormsService', () => {
  const prisma = {
    event: {
      findUnique: jest.fn(),
    },
    eventFormQuestion: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  } as any;

  let service: EventFormsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventFormsService(prisma);
  });

  it('getForm should throw when event is missing', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.getForm('e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getForm should return event questions', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1' });
    prisma.eventFormQuestion.findMany.mockResolvedValue([{ id: 'q1', question: 'Name?', required: true }]);

    const questions = await service.getForm('e1');
    expect(questions).toHaveLength(1);
  });

  it('updateForm should block non-owner non-admin', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id' });

    await expect(
      service.updateForm('e1', { questions: [{ question: 'Name?', required: true }] }, 'other-user', 'USER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updateForm should replace questions', async () => {
    prisma.event.findUnique.mockResolvedValue({ id: 'e1', organizerId: 'owner-id' });
    prisma.eventFormQuestion.deleteMany.mockResolvedValue({ count: 1 });
    prisma.eventFormQuestion.createMany.mockResolvedValue({ count: 1 });
    prisma.eventFormQuestion.findMany.mockResolvedValue([{ id: 'q1', question: 'Name?', required: true }]);

    const data = await service.updateForm(
      'e1',
      { questions: [{ question: 'Name?', required: true }] },
      'owner-id',
      'ORGANIZER',
    );

    expect(prisma.eventFormQuestion.deleteMany).toHaveBeenCalledWith({ where: { eventId: 'e1' } });
    expect(prisma.eventFormQuestion.createMany).toHaveBeenCalledWith({
      data: [{ question: 'Name?', required: true, eventId: 'e1' }],
    });
    expect(data).toHaveLength(1);
  });
});
