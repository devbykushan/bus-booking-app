# 📱 WAHA (WhatsApp HTTP API) Setup Guide

This project uses **WAHA (WhatsApp HTTP API)** to send automated booking confirmations, E-Tickets with QR codes, and OTP verification messages to passengers via WhatsApp.

---

## 🚀 Quick Start

### 1. Ensure Docker Desktop is Running
Make sure **Docker Desktop** is launched on your Mac.

### 2. Start the WAHA Container
Run the following command from the `bus-booking-app` directory:

```bash
npm run waha:start
```
*(Or directly: `docker compose up -d`)*

---

## 📲 Pair Your WhatsApp Account

1. Open the WAHA Web Dashboard in your browser:
   👉 **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**
   *(or visit the Swagger API docs at [http://localhost:3000](http://localhost:3000))*

2. Click on the **`default`** session.
3. Click **Start Session** / **Scan QR Code**.
4. Open WhatsApp on your phone:
   - Go to **Settings** > **Linked Devices** > **Link a Device**.
   - Scan the QR code displayed in the dashboard (or in your terminal logs via `npm run waha:logs`).
5. Once paired, status will show **`WORKING`** (Connected).

---

## ⚙️ Backend Integration Settings

Your `backend/.env` file is already configured to communicate with WAHA:

```env
# WAHA WhatsApp E-Ticket Notification Service
WAHA_API_URL=http://localhost:3000
WAHA_SESSION=default
WAHA_ENABLED=true
```

---

## 🧪 Testing WhatsApp Notifications

Once WAHA status is `WORKING`:
1. Start your backend and frontend:
   ```bash
   npm run dev
   ```
2. Make a test bus seat booking in the app and enter a valid Sri Lankan / international mobile number (e.g., `0771234567` or `+94771234567`).
3. Upon booking confirmation, WAHA will automatically send the formatted E-Ticket to the passenger's WhatsApp!

---

## 🛠 Useful Commands

| Action | Command |
|---|---|
| **Start WAHA** | `npm run waha:start` |
| **Stop WAHA** | `npm run waha:stop` |
| **View Live Logs / QR** | `npm run waha:logs` |
| **WAHA Dashboard** | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) |
