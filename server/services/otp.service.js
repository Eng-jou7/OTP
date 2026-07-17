const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
const whatsappService = require('./whatsapp.service');

const hasTwilioCredentials =
  TWILIO_ACCOUNT_SID &&
  TWILIO_AUTH_TOKEN &&
  TWILIO_VERIFY_SID &&
  TWILIO_ACCOUNT_SID !== 'your-twilio-sid' &&
  TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token' &&
  TWILIO_VERIFY_SID !== 'your-twilio-verify-sid';

// Generate a random 6-digit OTP code
function generateRandomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory store for WhatsApp OTPs and dev fallback SMS OTPs
const otpStore = new Map();

const sendOTP = async (phone, channel = 'sms') => {
  const code = generateRandomOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Save in local memory store for verification
  otpStore.set(phone, { code, expiresAt });

  if (channel === 'whatsapp') {
    // Try to send via our free WhatsApp Bot
    const result = await whatsappService.sendWhatsAppOTP(phone, code);
    
    if (result.success) {
      return { status: 'sent', provider: 'whatsapp-bot' };
    } else {
      // Fallback if WhatsApp bot is not scanned or connected yet
      console.log(`\n========================================`);
      console.log(`  💬 [WhatsApp Fallback] OTP for ${phone}: ${code}`);
      console.log(`  ⏱️  Expires in 5 minutes`);
      console.log(`========================================\n`);
      return { status: 'pending', code, fallback: true };
    }
  }

  // SMS Channel
  if (hasTwilioCredentials) {
    try {
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const verification = await twilio.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verifications.create({ to: phone, channel: 'sms' });

      console.log(`\n========================================`);
      console.log(`  📱 Twilio SMS OTP sent to ${phone}`);
      console.log(`========================================\n`);
      return { status: 'sent', provider: 'twilio-sms' };
    } catch (err) {
      console.error('Twilio SMS sending failed, falling back to Console:', err.message);
      // Fallback if Twilio balance/delivery fails
      console.log(`\n========================================`);
      console.log(`  📱 [Twilio Fallback] OTP for ${phone}: ${code}`);
      console.log(`  ⏱️  Expires in 5 minutes`);
      console.log(`========================================\n`);
      return { status: 'pending', code, fallback: true };
    }
  } else {
    // Standard Development mode
    console.log(`\n========================================`);
    console.log(`  📱 SMS OTP for ${phone}: ${code}`);
    console.log(`  ⏱️  Expires in 5 minutes`);
    console.log(`========================================\n`);
    return { status: 'pending', code };
  }
};

const verifyOTP = async (phone, code) => {
  // Check the local store first (used by WhatsApp and SMS fallback)
  const stored = otpStore.get(phone);
  if (stored) {
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return false;
    }
    if (stored.code === code) {
      otpStore.delete(phone);
      return true;
    }
  }

  // If local store does not contain the check, check via Twilio if credentials exist
  if (hasTwilioCredentials) {
    try {
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const check = await twilio.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: phone, code });
      
      return check.status === 'approved';
    } catch (err) {
      console.error('Twilio verification check failed:', err.message);
      return false;
    }
  }

  return false;
};

module.exports = { sendOTP, verifyOTP };
