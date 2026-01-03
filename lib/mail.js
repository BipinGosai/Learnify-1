import nodemailer from 'nodemailer';

export function getProfessorEmail() {
  return process.env.PROFESSOR_EMAIL || process.env.ABC_PROFESSOR_EMAIL || '';
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:3000';
}

export async function sendProfessorVerificationEmail({
  to,
  courseName,
  courseLevel,
  courseCategory,
  verificationLink,
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!process.env.SMTP_PORT) missing.push('SMTP_PORT');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');
  if (!(process.env.SMTP_FROM || user)) missing.push('SMTP_FROM');
  if (!to) missing.push('PROFESSOR_EMAIL');

  if (missing.length > 0) {
    return { ok: false, reason: 'smtp_not_configured', missing };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `Course verification requested: ${courseName || 'Untitled course'}`;

  const text = [
    'A student submitted AI-generated course content for verification.',
    '',
    `Course: ${courseName || '—'}`,
    `Level: ${courseLevel || '—'}`,
    `Category: ${courseCategory || '—'}`,
    '',
    'Review and provide feedback (approve or request changes) at:',
    verificationLink,
    '',
    'If you did not expect this email, you can ignore it.',
  ].join('\n');

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
    return { ok: true };
  } catch (err) {
    // Do not include secrets; only return the error message.
    return {
      ok: false,
      reason: 'smtp_send_failed',
      message: typeof err?.message === 'string' ? err.message : 'Failed to send email',
    };
  }
}
