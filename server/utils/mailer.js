const nodemailer = require('nodemailer');

const STATUS_CONFIG = {
  submitted    : { label: 'Submitted',    color: '#6B7280', bg: '#F3F4F6' },
  under_review : { label: 'Under Review', color: '#D97706', bg: '#FFFBEB' },
  assigned     : { label: 'Assigned',     color: '#2563EB', bg: '#EFF6FF' },
  in_progress  : { label: 'In Progress',  color: '#7C3AED', bg: '#F5F3FF' },
  resolved     : { label: 'Resolved',     color: '#16A34A', bg: '#F0FDF4' },
  rejected     : { label: 'Rejected',     color: '#DC2626', bg: '#FEF2F2' },
};

function createTransporter() {
  return nodemailer.createTransport({
    host  : process.env.SMTP_HOST || 'smtp.gmail.com',
    port  : parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth  : { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls   : { rejectUnauthorized: false },
  });
}

function generateEmailHTML({ complaintNo, status, publicNote, trackUrl, category }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:12px;border:1px solid #E5E7EB;max-width:600px;width:100%;">
<tr><td style="background:#185FA5;padding:28px 32px;">
  <h1 style="margin:0;color:#fff;font-size:22px;">Municipal Board</h1>
  <p style="margin:6px 0 0;color:#BFDBFE;font-size:14px;">Public Problem Reporting System</p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 24px;font-size:15px;color:#374151;">Your complaint has been updated.</p>
  <div style="background:#F3F4F6;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
    <p style="margin:0 0 4px;font-size:12px;color:#6B7280;text-transform:uppercase;">Complaint Number</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#111827;">${complaintNo}</p>
  </div>
  <div style="background:${s.bg};border-radius:8px;padding:14px 16px;margin-bottom:20px;border:1px solid ${s.color}30;">
    <p style="margin:0 0 4px;font-size:11px;color:#6B7280;text-transform:uppercase;">Status</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${s.color};">${s.label}</p>
  </div>
  ${publicNote ? `<div style="border-left:4px solid #185FA5;background:#EFF6FF;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0 0 6px;font-size:12px;color:#1D4ED8;font-weight:600;">Note from Municipal Office</p>
    <p style="margin:0;font-size:14px;color:#1E40AF;">${publicNote}</p>
  </div>` : ''}
  <div style="text-align:center;margin:28px 0;">
    <a href="${trackUrl}" style="display:inline-block;background:#185FA5;color:#fff;
      text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
      Track Your Complaint
    </a>
  </div>
</td></tr>
<tr><td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#9CA3AF;">© ${new Date().getFullYear()} Municipal Board</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendStatusUpdateEmail({ to, complaintNo, status, publicNote, trackUrl, category }) {
  if (!to || !to.includes('@')) return;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const transporter = createTransporter();
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
    await transporter.sendMail({
      from   : `"Municipal Board" <${process.env.SMTP_USER}>`,
      to,
      subject: `Update on your complaint ${complaintNo} — ${s.label}`,
      html   : generateEmailHTML({ complaintNo, status, publicNote, trackUrl, category }),
    });
    console.log(`[mailer] Email sent to ${to}`);
  } catch (err) {
    console.error('[mailer] Failed:', err.message);
  }
}

module.exports = { sendStatusUpdateEmail };
