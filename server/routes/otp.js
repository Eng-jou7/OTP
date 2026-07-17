const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateTokenPair } = require('../config/jwt');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  validatePhone,
  validateOTP,
  validateEmailOTP,
  validateEmailOTPVerify,
  handleValidationErrors,
} = require('../middleware/validate');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');

// ==========================================
// PHONE OTP (SMS / WhatsApp)
// ==========================================

// POST /api/otp/send
router.post(
  '/send',
  validatePhone,
  handleValidationErrors,
  otpLimiter,
  async (req, res, next) => {
    try {
      const { phone, channel } = req.body; // channel: 'sms' or 'whatsapp'

      const result = await otpService.sendOTP(phone, channel || 'sms');

      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
      const response = {
        success: true,
        message: `OTP sent via ${channelLabel} successfully`,
      };

      if (result.code) {
        response.devInfo = `Dev mode OTP code: ${result.code}`;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/otp/verify
router.post(
  '/verify',
  validateOTP,
  handleValidationErrors,
  authLimiter,
  async (req, res, next) => {
    try {
      const { phone, code } = req.body;

      const isValid = await otpService.verifyOTP(phone, code);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Find or create user
      let user = await User.findOne({ phone });

      if (!user) {
        user = new User({
          phone,
          phoneVerified: true,
          authProvider: 'phone',
          name: 'Phone User',
        });
      } else {
        user.phoneVerified = true;
      }

      // Generate tokens
      const tokens = generateTokenPair(user);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          authProvider: user.authProvider,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMAIL OTP
// ==========================================

// POST /api/otp/email/send
router.post(
  '/email/send',
  validateEmailOTP,
  handleValidationErrors,
  otpLimiter,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const result = await emailService.sendEmailOTP(email);

      const response = {
        success: true,
        message: 'Verification code sent to your email',
      };

      if (result.code) {
        response.devInfo = `Dev mode OTP code: ${result.code}`;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/otp/email/verify
router.post(
  '/email/verify',
  validateEmailOTPVerify,
  handleValidationErrors,
  authLimiter,
  async (req, res, next) => {
    try {
      const { email, code } = req.body;

      const isValid = await emailService.verifyEmailOTP(email, code);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code',
        });
      }

      // Find or create user
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          authProvider: 'local',
          name: email.split('@')[0],
        });
      }

      // Generate tokens
      const tokens = generateTokenPair(user);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          authProvider: user.authProvider,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
