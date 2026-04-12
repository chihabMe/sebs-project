import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    if (!resend) {
      console.warn('RESEND_API_KEY is not configured. Email will not be sent.');
      return false;
    }
    
    const { data, error } = await resend.emails.send({
      from: 'SEBS <onboarding@resend.dev>', // In production, use your verified domain
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendBookingConfirmation = async (user: any, event: any) => {
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
      <p style="font-size: 12px; color: #8c716d; text-align: center;">Indigo Pulse Archive Node</p>
    </div>
  `;

  return sendEmail(user.email, subject, text, html);
};

export const sendWelcomeEmail = async (user: any) => {
  const subject = 'Welcome to Indigo Pulse Archive';
  const text = `Welcome ${user.name} to our community of curators and explorers.`;
  return sendEmail(user.email, subject, text);
};
