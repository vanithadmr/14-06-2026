const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/lipsync/generate
 * Accepts: image/video file + script text
 * Returns: job ID and status
 */
app.post("/api/lipsync/generate", upload.single("avatar"), async (req, res) => {
  try {
    const { script, voiceId } = req.body;

    if (!script || script.trim().length === 0) {
      return res.status(400).json({ error: "Script text is required." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Avatar image or video is required." });
    }

    // Simulate async lip sync job (replace with real API: D-ID, HeyGen, Sync.so)
    const jobId = `lipsync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // In production: call D-ID / HeyGen / Sync.so API here
    // Example for D-ID:
    // const response = await axios.post('https://api.d-id.com/talks', {
    //   source_url: publicUrlOfUploadedFile,
    //   script: { type: 'text', input: script, provider: { type: 'microsoft', voice_id: voiceId } }
    // }, { headers: { Authorization: `Bearer ${process.env.DID_API_KEY}` } });

    res.json({
      success: true,
      jobId,
      status: "processing",
      message: "Lip sync generation started.",
      avatarUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      estimatedSeconds: 15,
    });

    // Simulate job completion after 15s (store to DB in production)
    setTimeout(() => {
      console.log(`Job ${jobId} completed (simulated).`);
    }, 15000);
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/lipsync/status/:jobId
 * Poll for job completion
 */
app.get("/api/lipsync/status/:jobId", (req, res) => {
  const { jobId } = req.params;

  // Simulate status (replace with real DB/Redis lookup)
  const createdAt = parseInt(jobId.split("_")[1] || "0");
  const elapsed = Date.now() - createdAt;
  const done = elapsed > 15000;

  if (done) {
    res.json({
      jobId,
      status: "done",
      // In production: return real video URL from D-ID / HeyGen
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      message: "Lip sync preview ready!",
    });
  } else {
    res.json({
      jobId,
      status: "processing",
      progress: Math.min(95, Math.floor((elapsed / 15000) * 100)),
      message: "Processing lip sync...",
    });
  }
});

/**
 * POST /api/lipsync/save
 * Save lip sync settings for a session
 */
app.post("/api/lipsync/save", (req, res) => {
  const { jobId, voiceId, script } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId is required." });

  // Save to DB in production
  res.json({ success: true, message: "Lip sync settings saved.", data: { jobId, voiceId, script } });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", service: "lipsync-backend" }));

app.listen(PORT, () => console.log(`🚀 Lip Sync backend running on http://localhost:${PORT}`));
