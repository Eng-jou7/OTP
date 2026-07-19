const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
const Otp = require('../models/Otp');
const whatsappService = require('./whatsapp.service');

const hasTwilioCredentials =
  TWILIO_ACCOUNT_SID &&
  TWILIO_AUTH_TOKEN &&
  TWILIO_VERIFY_SID &&
  TWILIO_ACCOUNT_SID !== 'your-twilio-sid' &&
  TWILIO_AUTH_TOKEN !== 'your-twilio-auth-token' &&
  TWILIO_VERIFY_SID !== 'your-twilio-verify-sid';

function generateRandomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOTP = async (phone, channel = 'sms') => {
  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await Otp.deleteMany({ emailOrPhone: phone });
  await Otp.create({ emailOrPhone: phone, code, expiresAt });

  if (channel === 'whatsapp') {
    // Try using the free WhatsApp Bot
    const result = await whatsappService.sendWhatsAppOTP(phone, code);
    
    if (result.success) {
      return { status: 'sent', provider: 'whatsapp-bot' };
    }
    
    // If we are on Vercel OR the WhatsApp bot is offline, try to send via Twilio WhatsApp
    if (result.isVercel || hasTwilioCredentials) {
      if (hasTwilioCredentials) {
        try {
          const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
          const verification = await twilio.verify.v2
            .services(TWILIO_VERIFY_SID)
            .verifications.create({ to: phone, channel: 'whatsapp' });

          console.log(`\n========================================`);
          console.log(`  💬 Twilio WhatsApp OTP sent to ${phone}`);
          console.log(`========================================\n`);
          return { status: 'sent', provider: 'twilio-whatsapp' };
        } catch (err) {
          console.error('Twilio Verify WhatsApp sending failed:', err.message);
        }
      }
    }
    
    // Fallback if both bot and Twilio fail
    console.log(`\n========================================`);
    console.log(`  💬 [WhatsApp Fallback] OTP for ${phone}: ${code}`);
    console.log(`  ⏱️  Expires in 5 minutes`);
    console.log(`========================================\n`);
    return { status: 'pending', code, fallback: true };
  }

  // SMS Channel via Twilio
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
      console.error('Twilio SMS failed, falling back to Console:', err.message);
      console.log(`\n========================================`);
      console.log(`  📱 [SMS Fallback] OTP for ${phone}: ${code}`);
      console.log(`  ⏱️  Expires in 5 minutes`);
      console.log(`========================================\n`);
      return { status: 'pending', code, fallback: true };
    }
  } else {
    console.log(`\n========================================`);
    console.log(`  📱 SMS OTP for ${phone}: ${code}`);
    console.log(`  ⏱️  Expires in 5 minutes`);
    console.log(`========================================\n`);
    return { status: 'pending', code };
  }
};

const verifyOTP = async (phone, code) => {
  const record = await Otp.findOne({ emailOrPhone: phone });
  
  if (record) {
    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      return false;
    }
    if (record.code === code) {
      await Otp.deleteOne({ _id: record._id });
      return true;
    }
  }

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
