import * as React from 'react';
import { render } from '@react-email/render';

type PasswordResetEmailProps = {
  name: string;
  resetUrl: string;
};

function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return React.createElement(
    'div',
    {
      style: {
        margin: '0 auto',
        maxWidth: '600px',
        border: '1px solid rgba(13, 92, 99, 0.12)',
        borderRadius: '24px',
        padding: '40px',
        color: '#172426',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff',
      },
    },
    React.createElement(
      'div',
      {
        style: {
          display: 'inline-block',
          borderRadius: '14px',
          backgroundColor: '#0d5c63',
          padding: '10px 14px',
          color: '#ffffff',
          fontWeight: 900,
          letterSpacing: '-0.03em',
        },
      },
      'Eventify',
    ),
    React.createElement(
      'h1',
      {
        style: {
          margin: '28px 0 12px',
          color: '#0d5c63',
          fontSize: '28px',
          fontWeight: 900,
          lineHeight: '1.15',
          letterSpacing: '-0.03em',
        },
      },
      'Reset your Eventify password',
    ),
    React.createElement(
      'p',
      { style: { margin: '0 0 16px', fontSize: '16px', lineHeight: '1.6' } },
      'Hi ',
      React.createElement('strong', null, name),
      ',',
    ),
    React.createElement(
      'p',
      { style: { margin: '0 0 28px', fontSize: '16px', lineHeight: '1.6' } },
      'We received a request to reset your password. Use the button below to choose a new one.',
    ),
    React.createElement(
      'a',
      {
        href: resetUrl,
        style: {
          display: 'inline-block',
          borderRadius: '14px',
          backgroundColor: '#0d5c63',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: 800,
          padding: '15px 22px',
          textDecoration: 'none',
        },
      },
      'Reset password',
    ),
    React.createElement(
      'p',
      { style: { margin: '28px 0 0', color: '#5f6f72', fontSize: '14px', lineHeight: '1.6' } },
      'This link expires in 30 minutes. If you did not request this, you can ignore this email.',
    ),
    React.createElement('hr', { style: { margin: '32px 0', border: 0, borderTop: '1px solid rgba(13, 92, 99, 0.12)' } }),
    React.createElement(
      'p',
      { style: { margin: 0, color: '#5f6f72', fontSize: '12px', textAlign: 'center' } },
      'Eventify',
    ),
  );
}

export async function renderPasswordResetEmail(props: PasswordResetEmailProps) {
  return render(React.createElement(PasswordResetEmail, props));
}
