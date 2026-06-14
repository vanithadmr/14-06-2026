# 🎙️ AI Twin – Lip Sync Module

A full-stack React + Node.js module for testing AI Twin lip sync generation.

## Project Structure

```
lipsync-app/
├── backend/          # Node.js + Express API
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/         # React UI
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── hooks/
    │   │   └── useLipSync.js       ← API calls + polling
    │   └── components/
    │       ├── LipSyncModule.jsx   ← Main page
    │       ├── StepIndicator.jsx   ← 6-step header
    │       ├── AvatarPanel.jsx     ← Upload + status
    │       └── ScriptPanel.jsx     ← Script + generate
    └── package.json
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # Add your lip sync API key
npm run dev            # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start              # Starts on http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lipsync/generate` | Upload avatar + script → returns jobId |
| GET | `/api/lipsync/status/:jobId` | Poll for video URL |
| POST | `/api/lipsync/save` | Save confirmed lip sync settings |
| GET | `/health` | Health check |

## Connecting a Real Lip Sync Provider

In `backend/server.js`, replace the simulation block in `/api/lipsync/generate` with a real API call:

### Option A – D-ID
```js
const { data } = await axios.post(
  'https://api.d-id.com/talks',
  {
    source_url: publicAvatarUrl,
    script: { type: 'text', input: script,
      provider: { type: 'microsoft', voice_id: 'en-US-JennyNeural' }
    }
  },
  { headers: { Authorization: `Bearer ${process.env.DID_API_KEY}` } }
);
// data.id → jobId, poll GET /talks/:id for status
```

### Option B – HeyGen
```js
const { data } = await axios.post(
  'https://api.heygen.com/v2/video/generate',
  { video_inputs: [...], ... },
  { headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY } }
);
```

### Option C – Sync.so
```js
const { data } = await axios.post(
  'https://api.sync.so/v2/generate',
  { model: 'lipsync-1.7.1', input: [...] },
  { headers: { 'x-api-key': process.env.SYNCSO_API_KEY } }
);
```

## Features

- ✅ Upload avatar (JPG/PNG/WEBP/MP4)
- ✅ Enter test script with character counter
- ✅ Progress bar with polling
- ✅ Video preview on completion
- ✅ Download preview video
- ✅ 6-step wizard indicator (matches your design)
- ✅ Fully responsive (mobile/tablet/desktop)
- ✅ Pink/rose brand theme matching your UI
