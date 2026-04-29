import { EventFormsController } from './event-forms.controller';

describe('EventFormsController', () => {
  const eventFormsService = {
    getForm: jest.fn(),
    updateForm: jest.fn(),
  } as any;

  let controller: EventFormsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EventFormsController(eventFormsService);
  });

  it('getForm should return questions payload', async () => {
    eventFormsService.getForm.mockResolvedValue([{ id: 'q1', question: 'Name?' }]);
    const response = await controller.getForm('e1');
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it('updateForm should return updated payload', async () => {
    eventFormsService.updateForm.mockResolvedValue([{ id: 'q1', question: 'Name?' }]);
    const response = await controller.updateForm(
      'e1',
      { questions: [{ question: 'Name?', required: true }] },
      'u1',
      'ORGANIZER',
    );
    expect(response.success).toBe(true);
    expect(response.message).toContain('updated');
    expect(response.data).toHaveLength(1);
  });
});
