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

The current recommendation engine is deterministic demo logic. Replace it with a trained prediction service when field data is available.
