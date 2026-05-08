import logger from '../utils/logger.js';

export class EmailDeliveryError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.cause = cause;
    this.code = cause?.code;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SENDGRID_API_KEY) return process.env.EMAIL_USER || 'noreply@field-sync.com';
  if (process.env.RESEND_API_KEY) return 'onboarding@resend.dev';
  return process.env.EMAIL_USER || 'noreply@field-sync.com';
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}

async function sendViaSendGrid({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: getFromAddress() },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid API error (${res.status}): ${body}`);
  }
}

async function sendViaSmtp({ to, subject, html }) {
  const nodemailer = (await import('nodemailer')).default;
  const dns = (await import('dns')).default;
  const net = (await import('net')).default;

  dns.setDefaultResultOrder('ipv4first');

  function tcpConnect(host, port, timeout = 4000) {
    return new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(timeout);
      s.on('connect', () => { s.destroy(); resolve(true); });
      s.on('error', () => { s.destroy(); resolve(false); });
      s.on('timeout', () => { s.destroy(); resolve(false); });
      s.connect(port, host);
    });
  }

  const hostname = process.env.SMTP_HOST || 'smtp.gmail.com';

  let ips = [];
  try {
    ips = await dns.promises.resolve4(hostname);
  } catch {
    ips = [hostname];
  }

  const configs = [];
  for (const ip of ips) {
    configs.push({ host: ip, port: 465, secure: true });
  }
  for (const ip of ips) {
    configs.push({ host: ip, port: 587, secure: false, requireTLS: true });
  }

  for (const cfg of configs) {
    const ok = await tcpConnect(cfg.host, cfg.port);
    if (ok) {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        requireTLS: cfg.requireTLS || false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
        tls: {
          servername: hostname,
          rejectUnauthorized: false,
        },
      });
      await transporter.sendMail({
        from: `"FieldSync" <${getFromAddress()}>`,
        to,
        subject,
        html,
      });
      return;
    }
  }

  throw new Error(`SMTP unreachable for ${hostname} (tried ${ips.length} IPs × 2 ports)`);
}

async function sendEmail({ to, subject, html }) {
  if (process.env.SENDGRID_API_KEY) {
    await sendViaSendGrid({ to, subject, html });
  } else if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, html });
  } else {
    await sendViaSmtp({ to, subject, html });
  }
}

// ─── Template helpers ──────────────────────────────────────────

function otpTemplate(name, otp, message = 'Your verification code for FieldSync is:') {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);
  return {
    subject: 'FieldSync OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Hello ${safeName},</h2>
        <p>${message}</p>
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
}

function resetTemplate(name, frontendUrl, token) {
  const safeName = escapeHtml(name);
  return {
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
}

function contactTemplate(name, email, subject, message) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const supportEmail = process.env.SUPPORT_EMAIL || 'fieldsyncsupport@gmail.com';
  return {
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
}

function inviteTemplate(email, inviteUrl, role, team) {
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role.replace('_', ' '));
  const safeTeam = escapeHtml(team || 'your team');
  return {
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
}

// ─── Public send functions ──────────────────────────────────────

export const sendOtpEmail = async (email, otp, userName) => {
  const { subject, html } = otpTemplate(userName, otp);
  try {
    await sendEmail({ to: email, subject, html });
    logger.info(`OTP email sent to ${email}`);
  } catch (error) {
    logger.error(`Email send failed: ${error.message || error}`);
    console.error(`[EMAIL] send failed to ${email}: ${error.message}`);
    throw new EmailDeliveryError('Unable to send verification email right now.', error);
  }
};

export const sendResetEmail = async (email, token, userName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const { subject, html } = resetTemplate(userName, frontendUrl, token);
  try {
    await sendEmail({ to: email, subject, html });
    logger.info(`Reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Reset email failed: ${error.message || error}`);
    console.error(`[EMAIL] reset failed to ${email}: ${error.message}`);
    throw error;
  }
};

export const sendContactInquiryEmail = async ({ name, email, subject, message }) => {
  const { to, subject: subj, html } = contactTemplate(name, email, subject, message);
  try {
    await sendEmail({ to, subject: subj, html });
    logger.info(`Contact inquiry email sent to ${to}`);
  } catch (error) {
    logger.error(`Contact inquiry email failed: ${error.message || error}`);
    console.error(`[EMAIL] contact inquiry failed: ${error.message}`);
    throw error;
  }
};

export const sendInviteEmail = async (email, inviteUrl, role, team) => {
  const { subject, html } = inviteTemplate(email, inviteUrl, role, team);
  try {
    await sendEmail({ to: email, subject, html });
    logger.info(`Invite email sent to ${email}`);
  } catch (error) {
    logger.error(`Invite email failed: ${error.message || error}`);
    console.error(`[EMAIL] invite failed to ${email}: ${error.message}`);
    throw error;
  }
};
