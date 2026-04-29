import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  const prisma = {
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  } as any;

  let service: TagsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TagsService(prisma);
  });

  it('findAll should return tags ordered by name', async () => {
    prisma.tag.findMany.mockResolvedValue([{ id: 't1', name: 'Art' }]);
    const tags = await service.findAll();
    expect(tags).toHaveLength(1);
  });

  it('create should reject duplicate tag name', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 't1', name: 'Art' });
    await expect(service.create({ name: 'Art' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should persist new tag', async () => {
    prisma.tag.findUnique.mockResolvedValue(null);
    prisma.tag.create.mockResolvedValue({ id: 't1', name: 'Art' });

    const tag = await service.create({ name: 'Art' });
    expect(tag.name).toBe('Art');
  });

  it('remove should throw not found when delete fails', async () => {
    prisma.tag.delete.mockRejectedValue(new Error('missing'));
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
