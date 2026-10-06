# AI Smart Farming

A starter full-stack dashboard that helps farmers make clearer crop and irrigation decisions from soil and weather inputs.

## Features

- Crop recommendation based on soil nutrients, temperature, humidity, pH, and rainfall
- Irrigation guidance with a simple water requirement estimate
- Farm dashboard with current soil-health indicators and actionable tips
- REST API designed to be replaced by a trained ML model later

## Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express, CORS

## Run locally

```bash
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:5000`.

## API

- `GET /api/health`
- `POST /api/recommendation`
- `POST /api/irrigation`

## Phase 2 connected features

- Farmer account registration and login with hashed passwords and JWT sessions
- Persistent local data store for farmer accounts and image-screening requests
- Live seven-day weather data from Open-Meteo, with a safe fallback when unavailable
- Authenticated leaf image intake for JPG, PNG, and WEBP files up to 5 MB

Before deploying, copy `backend/.env.example` to `backend/.env` and set a strong `JWT_SECRET`. The local JSON store is useful for development; switch it to a managed database before a multi-user production deployment.

The current recommendation engine is deterministic demo logic. Replace it with a trained prediction service when field data is available.
