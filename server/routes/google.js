const express = require('express');
const router = express.Router();
const passport = require('passport');
const { generateTokenPair } = require('../config/jwt');

// GET /api/google - Initiate Google OAuth
router.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/google/callback - Google OAuth callback
router.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/?error=google_auth_failed',
  }),
  async (req, res, next) => {
    try {
      const tokens = generateTokenPair(req.user);

      // Store refresh token
      req.user.refreshTokens.push(tokens.refreshToken);
      await req.user.save();

      res.redirect(
        `/?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
