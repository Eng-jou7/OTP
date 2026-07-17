const nodemailer = require('nodemailer');

// Generate a random 6-digit OTP code
function generateRandomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory store for email OTPs
const emailOtpStore = new Map();

// Create transporter
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_USER && SMTP_PASS && SMTP_USER !== 'your-gmail@gmail.com') {
    return nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return null;
}

const transporter = createTransporter();

async function sendEmailOTP(email) {
  const code = generateRandomOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  emailOtpStore.set(email.toLowerCase(), { code, expiresAt });

  if (transporter) {
    // Send real email
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="color: #818cf8; font-size: 28px; margin: 0 0 8px;">Auth<span style="color: #8b5cf6;">Pro</span></h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 30px;">Secure Authentication</p>
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; margin-bottom: 24px;">
            <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 20px;">Your verification code is:</p>
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; padding: 16px 24px; display: inline-block;">
              <span style="font-size: 32px; font-weight: 700; color: white; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0;">This code expires in <strong style="color: #818cf8;">5 minutes</strong></p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `${code} is your AuthPro verification code`,
      html: htmlTemplate,
    });

    console.log(`\n========================================`);
    console.log(`  📧 Email OTP sent to ${email}`);
    console.log(`========================================\n`);

    return { status: 'sent' };
  } else {
    // Dev mode — log to console
    console.log(`\n========================================`);
    console.log(`  📧 Email OTP for ${email}: ${code}`);
    console.log(`  ⏱️  Expires in 5 minutes`);
    console.log(`========================================\n`);

    return { status: 'pending', code };
  }
}

async function verifyEmailOTP(email, code) {
  const stored = emailOtpStore.get(email.toLowerCase());

  if (!stored) return false;

  if (Date.now() > stored.expiresAt) {
    emailOtpStore.delete(email.toLowerCase());
    return false;
  }

  if (stored.code !== code) return false;

  emailOtpStore.delete(email.toLowerCase());
  return true;
}

if (transporter) {
  console.log('Email OTP Service: Using SMTP for email verification');
} else {
  console.log('Email OTP Service: Using development mode (check console for codes)');
}

module.exports = { sendEmailOTP, verifyEmailOTP };
