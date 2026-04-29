import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { renderPasswordResetEmail } from './templates/password-reset.email';

@Injectable()
export class MailService {
  private resend: Resend | null;
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      if (!this.resend) {
        this.logger.warn('RESEND_API_KEY is not configured. Email will not be sent.');
        return false;
      }
      
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('MAIL_FROM') || 'Eventify <onboarding@resend.dev>',
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      });

      if (error) {
        this.logger.error(`Resend error: ${JSON.stringify(error)}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      return false;
    }
  }

  async sendBookingConfirmation(user: any, event: any) {
    const subject = `Booking Confirmed: ${event.title}`;
    const text = `Hi ${user.name},\n\nYour booking for ${event.title} on ${new Date(event.date).toLocaleDateString()} has been confirmed!\n\nLocation: ${event.location}\n\nSee you there!`;
    
    const html = `
      <div style="font-family: sans-serif; color: #32294f; max-width: 600px; margin: 0 auto; border: 1px solid #66000010; padding: 40px; border-radius: 20px;">
        <h1 style="color: #3e0000; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">Booking Confirmed</h1>
        <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${user.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">Your entry to the following experience has been authorized:</p>
        <div style="background: #fbf9f5; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #66000005;">
          <h2 style="margin: 0; color: #3e0000; font-size: 20px;">${event.title}</h2>
          <p style="margin: 8px 0 0; color: #58413e; font-size: 14px;">${new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
          <p style="margin: 4px 0 0; color: #58413e; font-size: 14px;">${event.location}</p>
        </div>
        <p style="font-size: 14px; color: #8c716d;">Please have your digital ticket ready at the entrance.</p>
        <hr style="border: 0; border-top: 1px solid #66000010; margin: 32px 0;">
        <p style="font-size: 12px; color: #8c716d; text-align: center;">Eventify</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, text, html);
  }

  async sendBookingRequestReceived(user: any, event: any) {
    const subject = `Application Received: ${event.title}`;
    const text = `Hi ${user.name},\n\nWe received your request to join ${event.title} on ${new Date(event.date).toLocaleDateString()}.\n\nLocation: ${event.location}\n\nWe will notify you once your request is reviewed.`;

    const html = `
      <div style="font-family: sans-serif; color: #32294f; max-width: 600px; margin: 0 auto; border: 1px solid #66000010; padding: 40px; border-radius: 20px;">
        <h1 style="color: #3e0000; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">Application Received</h1>
        <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${user.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">Your request to join this event has been received:</p>
        <div style="background: #fbf9f5; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #66000005;">
          <h2 style="margin: 0; color: #3e0000; font-size: 20px;">${event.title}</h2>
          <p style="margin: 8px 0 0; color: #58413e; font-size: 14px;">${new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
          <p style="margin: 4px 0 0; color: #58413e; font-size: 14px;">${event.location}</p>
        </div>
        <p style="font-size: 14px; color: #8c716d;">We will email you again when your application is accepted.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, text, html);
  }

  async sendWelcomeEmail(user: any) {
    const subject = 'Welcome to Eventify';
    const text = `Welcome ${user.name} to our community of curators and explorers.`;
    return this.sendEmail(user.email, subject, text);
  }

  async sendPasswordResetEmail(user: any, resetUrl: string) {
    const subject = 'Reset your Eventify password';
    const text = `Hi ${user.name},\n\nWe received a request to reset your Eventify password.\n\nOpen this link to set a new password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`;
    const html = await renderPasswordResetEmail({ name: user.name, resetUrl });

    return this.sendEmail(user.email, subject, text, html);
  }
}
