const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP with explicit TLS settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send an email notification (fire-and-forget).
 * Never throws — errors are logged to console.
 *
 * @param {string|string[]} to  - Recipient email(s)
 * @param {string} subject      - Email subject
 * @param {string} html         - Email HTML body
 */
const sendEmail = async (to, subject, html) => {
  // Skip if no recipients or credentials are missing
  if (!to || (Array.isArray(to) && to.length === 0)) return;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured. Skipping email.');
    return;
  }

  // Filter out empty/null emails
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    // Strip emojis from subject for better deliverability
    const cleanSubject = subject.replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{2B55}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA9F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();

    // Create a plain text version by stripping HTML tags
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const info = await transporter.sendMail({
      from: `"Smart Campus" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: cleanSubject,
      text: text,
      html: html,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Smart Campus Notification System',
      },
    });

    console.log(`📧 Email sent successfully (ID: ${info.messageId}) to: ${recipients.join(', ')}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }
};

module.exports = { sendEmail };
