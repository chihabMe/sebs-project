import nodemailer from 'nodemailer';

// Dummy transporter for development
const transporter = {
  sendMail: async (options: any) => {
    console.log('--- [DUMMY EMAIL] ---');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.text);
    console.log('----------------------');
    return { messageId: 'dummy-id-' + Date.now() };
  }
};

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    // In production, use real transporter:
    // const transporter = nodemailer.createTransport({...});
    await transporter.sendMail({
      from: '"SEBS" <noreply@sebs.com>',
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendBookingConfirmation = async (user: any, event: any) => {
  const subject = `Booking Confirmed: ${event.title}`;
  const text = `Hi ${user.name},\n\nYour booking for ${event.title} on ${new Date(event.date).toLocaleDateString()} has been confirmed!\n\nLocation: ${event.location}\n\nSee you there!`;
  return sendEmail(user.email, subject, text);
};
