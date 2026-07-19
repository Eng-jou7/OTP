# 🛡️ Prime Stack — Professional Authentication System

A full-stack Node.js authentication system with **email/password**, **Google OAuth 2.0**, and **mobile phone OTP** verification — wrapped in a stunning glassmorphism UI.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb)

## ✨ Features

- **Email/Password Authentication** — Register & login with bcrypt-hashed passwords
- **Google OAuth 2.0** — One-click Google sign-in via Passport.js
- **Phone OTP Verification** — SMS OTP via Twilio (with dev-mode fallback)
- **JWT Token Architecture** — Access tokens (15min) + Refresh tokens (7 days)
- **Premium UI** — Glassmorphism design, animated backgrounds, micro-animations
- **Security Hardened** — Helmet, CORS, rate limiting, input validation

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **MongoDB** running locally (or use [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Required
MONGO_URI=mongodb://localhost:27017/prime-stack
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Google OAuth (optional — get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/google/callback

# Twilio SMS (optional — dev mode works without it)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SID=your-twilio-verify-sid
```

### 3. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### 4. Open in Browser

Navigate to **http://localhost:3000**

## 🧪 Dev Mode

In development mode (`NODE_ENV=development`):

- **Phone OTP**: Always use code `123456` (logged to console)
- **Google OAuth**: Requires real credentials from [Google Cloud Console](https://console.cloud.google.com/)

## 📡 API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |
| `GET` | `/api/auth/me` | Get current user (protected) |

### Google OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/google` | Redirect to Google consent |
| `GET` | `/api/google/callback` | OAuth callback handler |

### Phone OTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/otp/send` | Send OTP to phone number |
| `POST` | `/api/otp/verify` | Verify OTP code |

### Request/Response Examples

**Register:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
  "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
}
```

**Phone OTP:**
```json
POST /api/otp/send
{ "phone": "+1234567890" }

POST /api/otp/verify
{ "phone": "+1234567890", "code": "123456" }
```

## 🔒 Security Features

- **Helmet** — HTTP security headers
- **CORS** — Cross-origin resource sharing protection
- **Rate Limiting** — 100 req/15min (general), 10/15min (auth), 5/15min (OTP)
- **bcrypt** — Password hashing (12 salt rounds)
- **JWT** — Stateless authentication with refresh rotation
- **Input Validation** — express-validator on all endpoints

## 📁 Project Structure

```
prime-stack/
├── server/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── passport.js        # Google OAuth strategy
│   │   └── jwt.js             # JWT helpers
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── validate.js        # Input validation
│   ├── models/
│   │   └── User.js            # User schema
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── google.js          # Google OAuth
│   │   └── otp.js             # Phone OTP
│   ├── services/
│   │   └── otp.service.js     # OTP logic
│   └── server.js              # Entry point
├── public/
│   ├── index.html             # Auth pages
│   ├── dashboard.html         # User dashboard
│   ├── css/styles.css         # Premium UI
│   └── js/
│       ├── auth.js            # Auth logic
│       ├── otp.js             # OTP flow
│       └── app.js             # Dashboard
├── .env                       # Environment config
├── .env.example               # Config template
├── package.json
└── README.md
```

## 📄 License

MIT
