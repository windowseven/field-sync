import nodemailer from 'nodemailer';
import dns from 'dns';
import logger from '../utils/logger.js';

dns.setDefaultResultOrder('ipv4first');

export class EmailDeliveryError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.cause = cause;
    this.code = cause?.code;
  }
}

// HTML entity escaping to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    servername: smtpHost,
  },
});

export const sendOtpEmail = async (email, otp, userName) => {
  const safeName = escapeHtml(userName);
  const safeOtp = escapeHtml(otp);

  const mailOptions = {
    from: `"FieldSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'FieldSync OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Hello ${safeName},</h2>
        <p>Your verification code for FieldSync is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${safeOtp}</span>
        </div>
        <p style="color: #666;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">FieldSync Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw new EmailDeliveryError('Unable to send verification email right now.', error);
  }
};

export const sendResetEmail = async (email, token, userName) => {
  const safeName = escapeHtml(userName);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"FieldSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'FieldSync Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${safeName},</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/reset-password?token=${encodeURIComponent(token)}"
             style="background: #1d4ed8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">This link expires in <strong>1 hour</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">FieldSync Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Reset email sent to ${email}`);
  } catch (error) {
    logger.error('Reset email failed:', error);
    throw error;
  }
};

export const sendContactInquiryEmail = async ({ name, email, subject, message }) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const supportEmail = process.env.SUPPORT_EMAIL || 'fieldsyncsupport@gmail.com';

  const mailOptions = {
    from: `"FieldSync Contact" <${process.env.EMAIL_USER}>`,
    to: supportEmail,
    subject: `New Contact Inquiry: ${safeSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Contact Inquiry</h2>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>From:</strong> ${safeName}</p>
          <p style="margin: 8px 0 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <p style="margin: 8px 0 0;"><strong>Subject:</strong> ${safeSubject}</p>
        </div>
        <div style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #334155;">${safeMessage}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">This inquiry was submitted via the FieldSync website contact form.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Contact inquiry email sent to ${supportEmail}`);
  } catch (error) {
    logger.error('Contact inquiry email failed:', error);
    throw error;
  }
};

export const sendInviteEmail = async (email, inviteUrl, role, team) => {
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role.replace('_', ' '));
  const safeTeam = escapeHtml(team || 'your team');

  const mailOptions = {
    from: `"FieldSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `You're invited to join FieldSync as ${safeRole}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">You've been invited to FieldSync</h2>
        <p>You have been invited to join FieldSync as a <strong>${safeRole}</strong>${team ? ` on team <strong>${safeTeam}</strong>` : ''}.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}"
             style="background: #34d399; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666;">This invitation expires in <strong>7 days</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you didn't expect this invitation, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">FieldSync Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Invite email sent to ${email}`);
  } catch (error) {
    logger.error('Invite email failed:', error);
    throw error;
  }
};
