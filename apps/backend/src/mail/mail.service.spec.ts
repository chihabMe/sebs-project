import { MailService } from './mail.service';

jest.mock('./templates/password-reset.email', () => ({
  renderPasswordResetEmail: jest.fn(({ resetUrl }) =>
    Promise.resolve(`<div><h1>Reset your Eventify password</h1><a href="${resetUrl}">Reset password</a><p>Eventify</p></div>`),
  ),
}));

describe('MailService', () => {
  it('sendEmail should not send when RESEND_API_KEY is missing', async () => {
    const configService = {
      get: jest.fn(() => undefined),
    };
    const service = new MailService(configService as any);

    await expect(service.sendEmail('user@example.com', 'Subject', 'Body')).resolves.toBe(false);
  });

  it('sendEmail should use the configured sender when Resend is available', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-resend-key';
        if (key === 'MAIL_FROM') return 'Eventify <contact@eventify.online>';
        return undefined;
      }),
    };
    const service = new MailService(configService as any);
    const send = jest.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null });
    (service as any).resend = { emails: { send } };

    await expect(service.sendEmail('user@example.com', 'Subject', 'Body')).resolves.toBe(true);

    expect(send).toHaveBeenCalledWith({
      from: 'Eventify <contact@eventify.online>',
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body',
      html: 'Body',
    });
  });

  it('sendPasswordResetEmail should include Eventify branding, reset URL, and expiry text', async () => {
    const configService = {
      get: jest.fn(() => undefined),
    };
    const service = new MailService(configService as any);
    const sendEmail = jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

    await expect(
      service.sendPasswordResetEmail(
        { email: 'user@example.com', name: 'User' },
        'https://eventify.online/reset-password?token=abc',
      ),
    ).resolves.toBe(true);

    expect(sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Reset your Eventify password',
      expect.stringContaining('https://eventify.online/reset-password?token=abc'),
      expect.stringContaining('Reset your Eventify password'),
    );
    expect(sendEmail.mock.calls[0][2]).toContain('This link expires in 30 minutes');
    expect(sendEmail.mock.calls[0][3]).toContain('Eventify');
  });
});
