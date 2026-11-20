<div align="center">

<img src="https://dewmina-super-admin.vercel.app/icons/icon-192x192.png" alt="Dewmina Super Line Logo" width="96" height="96" />

# 🚌 Dewmina Super Line — Bus Booking Platform

**A full-stack, real-time bus ticket reservation system built for Sri Lanka's inter-city transport.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dewmina--super--admin.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://dewmina-super-admin.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech)

</div>

---

## ✨ Features

### 🧑‍💼 Passenger Experience
- 🔍 **Real-time bus search** — Search routes with live seat availability
- 💺 **Interactive seat selection** — Visual seat map with gender-based allocation
- 🎫 **E-Ticket generation** — QR-coded PDF tickets delivered instantly
- 📱 **WhatsApp notifications** — OTP, booking confirmations, departure reminders & E-Tickets
- 📋 **My Bookings** — Full booking history with PNR tracking
- 🌐 **Multi-language support** — English, Sinhala (සිංහල), Tamil (தமிழ்)
- 📲 **PWA support** — Install as an app on Android & iOS

### 🛡️ Admin Panel
- 📊 **Live Dashboard** — Revenue, seat fill rates, passenger counts at a glance
- 🗓️ **Schedule Management** — Create, edit and manage daily bus schedules
- 💰 **Payment Slip Verification** — Review and approve bank transfer slips with real-time badge alerts
- 👥 **Passenger Management** — View all users, booking details and contact info
- 🔧 **Master Settings** — Routes, buses, stops, pricing and service configuration
- 🔐 **Role-based access control** — `super_admin`, `admin`, `passenger` roles with granular permissions

### 🔒 Security & Auth
- Google OAuth 2.0 login with auto account creation
- OTP-based email verification for traditional sign-up
- JWT-style token authentication on all API routes
- Admin login protected with separate credential flow

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (Neon Serverless) |
| **Auth** | Google OAuth 2.0 + Nodemailer OTP |
| **Messaging** | WhatsApp via Baileys (WAHA) |
| **File Storage** | Cloudinary (payment slips) |
| **Deployment** | Vercel (Frontend) + Railway/Render (Backend) |
| **PWA** | Vite PWA Plugin + Workbox |

---

## 📁 Project Structure

```
bus-booking-app/
├── frontend/                  # React + Vite PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/         # Admin panel views
│   │   │   ├── passenger/     # Passenger-facing views
│   │   │   └── common/        # Shared UI components
│   │   ├── store/             # Zustand state + translations
│   │   └── services/          # API client
│   └── public/                # Icons, manifest
│
└── backend/                   # Express API server
    └── src/
        ├── routes/            # Auth, bookings, schedules, WhatsApp, admin
        ├── services/          # Email, WhatsApp, Cloudinary, PDF
        └── db/                # Neon PostgreSQL client
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)

### 1. Clone the repository

```bash
git clone https://github.com/devbykushan/bus-booking-app.git
cd bus-booking-app
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env     # Fill in your credentials
npm install
npm run dev
```

**Required `.env` variables:**
```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
SMTP_USER=...
SMTP_PASS=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env     # Set VITE_API_BASE_URL
npm install
npm run dev
```

---

## 📸 Screenshots

| Passenger Home | Seat Selection | Admin Dashboard |
|---|---|---|
| Search buses by route and date | Interactive seat map with live availability | Revenue, bookings & payment overview |

---

## 📬 Notifications Flow

```
Booking Confirmed
      │
      ├── 📧 Email (PDF E-Ticket)
      └── 📱 WhatsApp
              ├── Booking Confirmation
              ├── E-Ticket (image)
              └── Departure Reminder (1 hour before)
```

---

## 📄 License

This project is proprietary software developed for **Dewmina Super Line (Pvt) Ltd**.  
All rights reserved © 2024–2025 Dewmina Super Line.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/devbykushan">@devbykushan</a></sub>
</div>
