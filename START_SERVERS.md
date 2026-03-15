# Healthcare Platform — Start Servers

## Project Structure

```
tp project/
 ├── backend/              ← All backend code (Node.js + Express + SQLite)
 │    ├── src/
 │    │    ├── app.js
 │    │    ├── server.js
 │    │    ├── config/      (db.js)
 │    │    ├── controllers/ (authController, etc.)
 │    │    ├── data/        (mockData.js)
 │    │    ├── middleware/   (authenticate, authorize, rateLimiter)
 │    │    ├── models/       (User, OtpToken, Session, Appointment)
 │    │    ├── routes/       (authRoutes, aiRoutes, hospitalRoutes, doctorRoutes, ...)
 │    │    └── services/     (authService, otpService, aiService)
 │    ├── .env
 │    └── package.json
 │
 └── Software-Grp-Project/ ← All frontend code (React + Vite)
      ├── src/
      │    ├── pages/        (Home, Login, Signup, VerifyOtp, ...)
      │    ├── contexts/     (AuthContext.jsx)
      │    └── components/
      └── package.json
```

---

## Start Backend

```bash
cd backend
npm start
```

Runs on: **http://localhost:5000**

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register + send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP + activate |
| POST | `/api/auth/login` | Login + get JWT |
| POST | `/api/auth/refresh-token` | Renew access token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset OTP |
| POST | `/api/auth/reset-password` | Reset password |
| GET  | `/api/auth/profile` | Get profile (🔒) |
| PUT  | `/api/auth/profile` | Update profile (🔒) |
| GET  | `/api/hospitals` | List hospitals |
| GET  | `/api/hospitals/:id` | Hospital by ID |
| GET  | `/api/doctors` | List doctors |
| GET  | `/api/doctors/:id` | Doctor by ID |
| POST | `/api/doctors/nearest` | Nearest doctors (Haversine) |
| GET  | `/api/departments` | List departments |
| POST | `/api/medicine-suggestion` | Symptom → medicine |
| POST | `/api/ai/analyze` | AI medical report analysis |
| GET  | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |

---

## Start Frontend

```bash
cd Software-Grp-Project
npm run dev
```

Runs on: **http://localhost:5173**

---

## Environment Variables (backend/.env)

```env
PORT=5000
EMAIL=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
OTP_EXPIRES_MINUTES=10
NODE_ENV=development
```

> For OTP email: generate a Gmail **App Password** at
> Google Account → Security → 2-Step Verification → App Passwords
