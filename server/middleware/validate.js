const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validatePhone = [
  body('phone')
    .matches(/^\+[1-9]\d{6,14}$/)
    .withMessage('Valid phone number required (e.g. +1234567890)'),
];

const validateOTP = [
  body('phone')
    .matches(/^\+[1-9]\d{6,14}$/)
    .withMessage('Valid phone required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Invalid OTP code'),
];

const validateEmailOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
];

const validateEmailOTPVerify = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Invalid verification code'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePhone,
  validateOTP,
  validateEmailOTP,
  validateEmailOTPVerify,
  handleValidationErrors,
};
