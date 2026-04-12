<div align="center">

```
╔╦╗╔═╗╔╦╗╦╔═╗╔═╗╦═╗╔═╗  ╔═╗╦  ╦ ╦╔═╗
║║║║╣  ║║║║  ╠═╣╠╦╝║╣   ╠═╝║  ║ ║╚═╗
╩ ╩╚═╝═╩╝╩╚═╝╩ ╩╩╚═╚═╝  ╩  ╩═╝╚═╝╚═╝
```

**A comprehensive full-stack healthcare management platform**

[![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)](https://github.com/krushil21386/Software-Grp-Project2)
[![Version](https://img.shields.io/badge/Version-1.0.0-3b82f6?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/krushil21386/Software-Grp-Project2)
[![License](https://img.shields.io/badge/License-ISC-a855f7?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://github.com/krushil21386/Software-Grp-Project2)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-f59e0b?style=for-the-badge&logo=javascript&logoColor=white)](https://github.com/krushil21386/Software-Grp-Project2)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-WIP-f59e0b?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io)

![Full-Stack](https://img.shields.io/badge/Domain-Full--Stack%20Web-6366f1?style=flat-square&logo=stackblitz&logoColor=white)
![Cybersecurity](https://img.shields.io/badge/Domain-Cybersecurity-ef4444?style=flat-square&logo=springsecurity&logoColor=white)
![AI/ML](https://img.shields.io/badge/Domain-AI%20%26%20ML-f97316?style=flat-square&logo=googlegemini&logoColor=white)
![Real-Time](https://img.shields.io/badge/Domain-Real--Time%20Systems-06b6d4?style=flat-square&logo=socketdotio&logoColor=white)
![DevOps](https://img.shields.io/badge/Domain-DevOps%20%26%20Cloud%20(WIP)-f59e0b?style=flat-square&logo=docker&logoColor=white)
![Database](https://img.shields.io/badge/Domain-Database%20Engineering-16a34a?style=flat-square&logo=mongodb&logoColor=white)

---

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [🌐 Domains](#-project-domains) · [🛠 Tech Stack](#-tech-stack) · [📁 Structure](#-project-structure) · [🔒 Security](#-security) · [📚 API](#-api-overview)

</div>

---

## 🎯 Overview

**Medicare Plus** is a comprehensive full-stack healthcare platform that streamlines appointment booking, medical record management, and AI-powered medical report analysis. The system facilitates seamless interaction between **patients**, **doctors**, and **administrators** with real-time synchronization.

> 🏥 Book appointments · 🤖 AI-powered report analysis · 📋 Manage medical records · ⚡ Real-time notifications

---

## 🌐 Project Domains

This project spans multiple computer science disciplines — built as a production-grade system, not just a student prototype.

<table>
<tr>
<td align="center" width="25%">

### 🖥 Full-Stack Web Development

</td>
<td width="75%">

End-to-end JavaScript application using **React 19** on the frontend and **Express 5 + Node.js 18** on the backend. Follows a clean separation of concerns: REST API layer, business logic controllers, Mongoose ODM for data modeling, and a component-driven UI with Vite as the build toolchain. Covers SPA architecture, routing, state management via Context API, custom hooks, and responsive layouts with TailwindCSS.

**Skills demonstrated:** REST API design · SPA development · ODM/ORM · Component architecture · Build tooling

</td>
</tr>
<tr>
<td align="center">

### 🔐 Cybersecurity

</td>
<td>

Security is not bolted on — it is baked into every layer. Implements **JWT with refresh token rotation**, **bcryptjs password hashing** (10 rounds), **OTP-based MFA** via email, **account lockdown** after 5 failed login attempts, **Helmet.js** security headers, **CORS enforcement**, and **rate limiting** on sensitive endpoints. Role-Based Access Control (RBAC) enforces minimum privilege across all API routes. Every security event — login, failure, lockout — is written to a structured **audit log** with IP, geolocation, user agent, and severity level.

**Skills demonstrated:** Authentication & authorization · Cryptography · RBAC · Rate limiting · Audit logging · OWASP principles

</td>
</tr>
<tr>
<td align="center">

### 🤖 Artificial Intelligence & ML

</td>
<td>

Integrates **Google Gemini API** for AI-powered medical lab report analysis — extracting findings, recommendations, and a confidence score from uploaded documents. Pairs this with **DeepSeek-OCR-2** for optical character recognition of handwritten and scanned medical documents, converting unstructured image data into structured, queryable records. Demonstrates real-world LLM API integration, prompt engineering, and multi-modal document processing in a production context.

**Skills demonstrated:** LLM API integration · OCR · Medical NLP · Prompt engineering · Structured output parsing

</td>
</tr>
<tr>
<td align="center">

### ⚡ Real-Time Systems

</td>
<td>

Uses **Socket.io 4.8** (WebSocket + long-polling fallback) to deliver live appointment notifications, instant dashboard updates, and real-time doctor-patient event broadcasting. Implements event-driven architecture with room-based channels, presence tracking, and guaranteed delivery patterns. The appointment collision detection system also operates in real time — preventing double-bookings across concurrent users without requiring page refreshes.

**Skills demonstrated:** WebSocket protocol · Event-driven architecture · Pub/Sub patterns · Concurrency handling

</td>
</tr>
<tr>
<td align="center">

### 🗄 Database Engineering

</td>
<td>

Designed a normalized **MongoDB** schema for 8+ collections with carefully placed indexes, unique constraints, and compound query optimization. Mongoose schemas enforce data validation rules at the ODM level (before hitting the DB), while the application layer adds an additional validation pass. Covers document-oriented data modeling, aggregation pipelines for analytics, lifecycle state machines (record statuses), and handling of relational-style references (patientId, doctorId) in a NoSQL context.

**Skills demonstrated:** NoSQL schema design · Indexing & query optimization · Data validation · Aggregation pipelines

</td>
</tr>
<tr>
<td align="center">

### 🐳 DevOps & Cloud *(In Progress)*

</td>
<td>

Docker configuration files (`docker-compose.yml`, `Dockerfile`) have been written and committed to the repository, demonstrating understanding of multi-service containerization and orchestration concepts. The compose file defines service structure for the frontend, backend, and MongoDB. While full end-to-end Docker deployment is **not yet functional**, the groundwork covers environment-based configuration management, service dependency ordering, and production vs. development separation — skills directly applicable to real-world cloud deployment pipelines.

> ⚠️ Docker files are present but the deployment is incomplete. Use manual startup for running the project.

**Skills demonstrated:** Containerization concepts · Docker Compose structure · Environment management · Service orchestration design

</td>
</tr>
<tr>
<td align="center">

### 📊 Software Engineering

</td>
<td>

Built following software engineering best practices: modular MVC architecture, middleware pipeline composition, centralized error handling, input sanitization, and comprehensive test coverage (Jest for unit tests, Cypress for E2E — **70%+ coverage**). Includes a formal **SRS (Software Requirements Specification)** document, Git-based version control with 66+ commits, and structured API design with consistent response formats.

**Skills demonstrated:** Software architecture · Testing (unit + E2E) · SRS documentation · Version control · API design

</td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Access Control
- Multi-factor authentication (OTP via Email)
- JWT-based token management with refresh rotation
- Role-Based Access Control (Patient / Doctor / Admin)
- Account lockdown after 5 failed login attempts
- Session management and tracking

### 📅 Appointment Management
- Book online and offline appointments
- Real-time appointment synchronization
- Collision detection to prevent double-booking
- Heatmap visualization for doctor availability (7×24 grid)
- Automated reminders (24h and 2h before)
- Reschedule and cancellation with reason tracking
- Urgent appointment prioritization

</td>
<td width="50%">

### 📋 Medical Records & AI
- AI-powered lab report analysis (Google Gemini)
- OCR integration for medical documents (DeepSeek-OCR-2)
- Doctor comments and prescription management
- Record lifecycle: `pending → reviewed → archived`
- Secure file upload with validation

### ⚡ Real-time & Analytics
- WebSocket integration via Socket.io
- Live appointment notifications & dashboard updates
- Doctor performance analytics
- Comprehensive audit logging
- IP address & location tracking
- Admin system-wide analytics dashboard

</td>
</tr>
</table>

---

## 🛠 Tech Stack

<table>
<tr>
<th align="center">🖥 Frontend</th>
<th align="center">⚙️ Backend</th>
<th align="center">🐳 DevOps</th>
</tr>
<tr>
<td>

| Package | Version |
|---------|---------|
| React | 19.2.3 |
| Vite | 7.1.2 |
| TailwindCSS | 4.1.18 |
| Socket.io Client | latest |
| Recharts | 3.8.0 |
| Leaflet | 1.9.4 |
| jsPDF | 4.2.1 |

</td>
<td>

| Package | Version |
|---------|---------|
| Node.js | 18+ |
| Express | 5.2.1 |
| MongoDB | 6+ |
| Socket.io | 4.8.3 |
| Mongoose | 9.3.1 |
| bcryptjs | latest |
| jsonwebtoken | latest |

</td>
<td>

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| Jest | Unit Testing |
| Cypress | E2E Testing |
| Nodemon | Dev Watch |
| Helmet.js | Security Headers |
| Multer | File Uploads |

</td>
</tr>
</table>

---

## 📋 Prerequisites

Before setting up, ensure you have the following installed:

| Requirement | Version | Link |
|------------|---------|------|
| Node.js | v18+ | [Download](https://nodejs.org/) |
| MongoDB | v6+ | [Download](https://www.mongodb.com/try/download/community) |
| Docker | Latest | [Download](https://www.docker.com/products/docker-desktop) |
| Git | Any | [Download](https://git-scm.com/) |

**System requirements:** 4GB RAM minimum · 2GB free disk space

**API Keys needed:**
- 🤖 [Google Gemini API Key](https://ai.google.dev/)
- 📧 Gmail App Password (for OTP email)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/krushil21386/Software-Grp-Project2.git
cd Software-Grp-Project2
```

### 2️⃣ Configure Environment Variables

**Backend** — create `backend/.env`:

```env
# ── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ──────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/medicare-plus
# Atlas: mongodb+srv://username:password@cluster.mongodb.net/medicare-plus

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
OTP_EXPIRES_MINUTES=10

# ── Email (Gmail) ─────────────────────────────────────────
EMAIL=your-email@gmail.com
EMAIL_PASS=your-app-password
# Get app password: Google Account → Security → 2-Step Verification → App Passwords

# ── AI Services ───────────────────────────────────────────
GEMINI_API_KEY=your-google-gemini-api-key

# ── File Upload ───────────────────────────────────────────
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ── Security ──────────────────────────────────────────────
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** — create `Software-Grp-Project/.env` *(optional)*:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3️⃣ Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd Software-Grp-Project && npm install
```

### 4️⃣ Start the Application

> ⚠️ **Note:** Docker configuration files (`docker-compose.yml`, `Dockerfile`) are present in the repository but Docker deployment is **not fully functional** at this time. Please use the **Manual** method below.

<table>
<tr>
<th>🖥 Manual (Recommended)</th>
<th>🐳 Docker (Work in Progress)</th>
</tr>
<tr>
<td>

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd Software-Grp-Project && npm run dev
# → http://localhost:5173
```

</td>
<td>

```bash
# ⚠️ Docker setup is incomplete — may not work as expected.
# docker-compose.yml is present but not fully configured.

docker compose up --build  # Not guaranteed to succeed

# Stop
docker compose down
```

</td>
</tr>
</table>

> ✅ Frontend: **http://localhost:5173** · Backend: **http://localhost:5000**

---

## 📁 Project Structure

```
Software-Grp-Project2/
│
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 🟢 server.js          ← Main server entry point
│   │   ├── 🟢 app.js             ← Express app setup
│   │   ├── 📂 config/            ← Database & app configuration
│   │   ├── 📂 controllers/       ← Business logic handlers
│   │   ├── 📂 routes/            ← API endpoint definitions
│   │   ├── 📂 models/            ← Mongoose database schemas
│   │   ├── 📂 middleware/        ← Auth, validation, error handling
│   │   └── 📂 services/          ← Helper & utility services
│   ├── 📄 .env                   ← Environment variables
│   └── 📄 package.json
│
├── 📂 Software-Grp-Project/      ← React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/        ← Reusable UI components
│   │   ├── 📂 pages/             ← Page-level components
│   │   ├── 📂 contexts/          ← React Context API
│   │   ├── 📂 hooks/             ← Custom React hooks
│   │   └── 🟢 App.jsx
│   ├── 📄 .env
│   └── 📄 package.json
│
├── 🚧 docker-compose.yml         ← Docker orchestration (WIP — not fully functional)
├── 📄 README.md
└── 📄 srs_document.md            ← System requirements spec
```

---

## 🔒 Security

<table>
<tr>
<td width="33%">

**🔑 Authentication**
- JWT + refresh token rotation
- OTP email verification
- bcryptjs password hashing (10 rounds)
- Account lockdown after 5 failures

</td>
<td width="33%">

**🛡 API Security**
- CORS origin enforcement
- Helmet.js security headers
- Rate limiting on auth endpoints
- Input validation & sanitization
- Secure file upload (type + size)

</td>
<td width="33%">

**🗄 Data Protection**
- HTTPS/TLS encryption in transit
- Encrypted MongoDB connections
- Secure session management
- IP & location tracking
- Comprehensive audit logging

</td>
</tr>
</table>

### 👥 Role-Based Access Control

| Role | Permissions |
|------|------------|
| 🙍 **Patient** | Book appointments · View own medical records |
| 👨‍⚕️ **Doctor** | Manage schedule · Review & comment on records · Write prescriptions |
| 👨‍💼 **Admin** | Full system oversight · User management · Analytics · Audit logs |

---

## 📚 API Overview

**Base URL:** `http://localhost:5000/api`

**Authentication:** All protected endpoints require a JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

| Group | Endpoints | Description |
|-------|-----------|-------------|
| `/auth` | Register, Login, OTP Verify | Authentication & session management |
| `/appointments` | Book, View, Reschedule, Cancel | Full appointment lifecycle |
| `/records` | Upload, View, Archive | Medical record management |
| `/analytics` | Stats, Metrics, Audit Logs | System analytics |
| `/doctors` | Profiles, Availability | Doctor info & scheduling |
| `/hospitals` | Departments, Info | Hospital management |

---

## 🗄 Database Models

<details>
<summary><strong>📋 View all schemas</strong></summary>

**User**
```javascript
{
  email, password, name,
  role: "patient" | "doctor" | "admin",
  isVerified, phone, avatar, address,
  failedLoginAttempts, lockUntil, lastLogin
}
```

**Appointment**
```javascript
{
  appointmentId, patientId, doctorId,
  appointmentDate, appointmentTime,
  mode: "Online" | "Offline",
  status: "upcoming" | "completed" | "cancelled",
  isUrgent, reminder24hSent, reminder2hSent
}
```

**MedicalRecord**
```javascript
{
  patientId, doctorId, reportFilePath,
  status: "pending" | "reviewed" | "archived",
  analysis: { findings, recommendations, confidence },
  doctorComments, prescriptionUrl
}
```

**AuditLog**
```javascript
{
  userId,
  category: "AUTH" | "APPOINTMENT" | "USER" | "ADMIN" | "SYSTEM",
  action, ipAddress, userAgent, location,
  timestamp,
  severity: "info" | "warning" | "error" | "critical"
}
```
</details>

---

## 🐛 Troubleshooting

<details>
<summary><strong>MongoDB Connection Error</strong> — <code>connect ECONNREFUSED 127.0.0.1:27017</code></summary>

```bash
# Start MongoDB locally
mongod

# Or switch to MongoDB Atlas in .env
MONGODB_URI=mongodb+srv://...
```
</details>

<details>
<summary><strong>Port In Use</strong> — <code>EADDRINUSE :::5000</code></summary>

```bash
lsof -i :5000
kill -9 <PID>
# Or change PORT= in backend/.env
```
</details>

<details>
<summary><strong>CORS Error</strong> — blocked by CORS policy</summary>

```bash
# Ensure this matches your frontend URL
CORS_ORIGIN=http://localhost:5173
# Restart the backend after changing
```
</details>

<details>
<summary><strong>Docker Build Failure</strong> — failed to load cache</summary>

```bash
docker system prune -a
docker compose up --build --no-cache
```
</details>

<details>
<summary><strong>Gemini API Error</strong> — API key not found or invalid</summary>

```bash
# Get key from https://ai.google.dev/
GEMINI_API_KEY=your-actual-api-key
```
</details>

<details>
<summary><strong>OTP Email Not Sending</strong> — 535-5.7.8 Username and password not accepted</summary>

Use a **Gmail App Password**, not your regular password:
`Google Account → Security → 2-Step Verification → App Passwords`

```bash
EMAIL_PASS=your-16-char-app-password
```
</details>

---

## 👨‍💻 My Contributions

```
┌─────────────────────────────────────────────────────────┐
│  Total Commits     66      Lines of Code    ~5,000+     │
│  API Endpoints     25+     Database Models  8+          │
│  Files Created     50+     Test Cases       30+         │
│  Test Coverage     70%+    Status           ✅ Active   │
└─────────────────────────────────────────────────────────┘
```

| # | Area | Highlights |
|---|------|-----------|
| 1 | **Backend Architecture** | Express REST API, MongoDB/Mongoose ODM, modular routing |
| 2 | **Auth & Security** | JWT system, OTP verification, RBAC, rate limiting, audit logging |
| 3 | **Appointment System** | Full booking workflow, collision detection, heatmap, reminders |
| 4 | **Medical Records & AI** | Gemini API integration, OCR, lifecycle management |
| 5 | **Real-time Features** | Socket.io events, live notifications, presence tracking |
| 6 | **Analytics** | Performance metrics, system stats, security monitoring |
| 7 | **Database Design** | Schema design, indexes, constraints, query optimization |
| 8 | **Frontend Integration** | API client, auth context, custom hooks, form handling |
| 9 | **DevOps** | Docker config files written (`docker-compose.yml`) — deployment incomplete (WIP) |
| 10 | **Documentation** | Setup guides, architecture docs, SRS document |

### 📅 Recent Commits

| Commit | Date | Description |
|--------|------|-------------|
| `c8b989ec` | 2026-04-12 | Final integration and deployment |
| `0199336c` | 2026-04-11 | Docker configuration |
| `ee3aa740` | 2026-04-10 | Socket.io implementation |
| `91e1877b` | 2026-04-09 | AI analysis integration |
| `8021e1b2` | 2026-04-08 | Appointment management |
| `538dfe8f` | 2026-04-07 | Medical records module |
| `5080d4f0` | 2026-04-06 | Security features |
| `ba40330` | 2026-04-05 | Dashboard components |

[View all commits →](https://github.com/krushil21386/Software-Grp-Project2/commits)

---

## 🚀 Deployment

> ⚠️ **Docker deployment is currently a work in progress.** The `docker-compose.yml` file is present in the repository but has not been fully configured or tested. Use the manual method for running the project locally.

**Recommended — Manual:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd Software-Grp-Project && npm run dev
```

**Production `.env` checklist** *(for when Docker deployment is completed)*:
```env
NODE_ENV=production
HTTPS=true
JWT_SECRET=<strong-random-secret>
MONGODB_URI=<production-atlas-uri>
GEMINI_API_KEY=<production-key>
```

---

## 🗺 Roadmap

| Status | Feature |
|--------|---------|
| 🚧 | Complete Docker containerization & deployment |
| 🔜 | Mobile app (React Native) |
| 🔜 | Video consultation feature |
| 🔜 | Advanced analytics dashboard |
| 🔜 | Multi-language support |
| 🔜 | SMS notifications |
| 🔜 | Payment gateway integration |
| 🔜 | Machine learning recommendations |
| 🔜 | 3D medical imaging viewer |

---

## 📞 Support & Contributing

**Get help:**
- 🐛 [GitHub Issues](https://github.com/krushil21386/Software-Grp-Project2/issues) — bug reports
- 💬 [GitHub Discussions](https://github.com/krushil21386/Software-Grp-Project2/discussions) — questions
- 📄 [SRS Document](./srs_document.md) — full system requirements

**Contributing:**
```bash
git fork  # Fork the repo
git checkout -b feature/YourFeature
git commit -m 'Add YourFeature'
git push origin feature/YourFeature
# Open a Pull Request
```

---

## 🙏 Credits & License

Built with: **Google Gemini** · **DeepSeek OCR** · **MongoDB** · **React** · **Express.js** · **Socket.io**

Licensed under the **ISC License** — see `LICENSE` for details.

---

<div align="center">

**Last Updated:** April 12, 2026 &nbsp;·&nbsp; **Version:** 1.0.0 &nbsp;·&nbsp; **Status:** ✅ Active Development

*⭐ If you find this project useful, please give it a star!*

[![GitHub stars](https://img.shields.io/github/stars/krushil21386/Software-Grp-Project2?style=social)](https://github.com/krushil21386/Software-Grp-Project2)

</div>
