import { TagsController } from './tags.controller';

describe('TagsController', () => {
  const tagsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  } as any;

  let controller: TagsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TagsController(tagsService);
  });

  it('findAll should return tags payload', async () => {
    tagsService.findAll.mockResolvedValue([{ id: 't1', name: 'Art' }]);
    const response = await controller.findAll();
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it('create should return created tag payload', async () => {
    tagsService.create.mockResolvedValue({ id: 't1', name: 'Art' });
    const response = await controller.create({ name: 'Art' }, 'admin-1');
    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Art');
  });

  it('remove should return success message', async () => {
    tagsService.remove.mockResolvedValue(undefined);
    const response = await controller.remove('t1', 'admin-1');
    expect(response.success).toBe(true);
    expect(response.message).toContain('deleted');
  });
});
