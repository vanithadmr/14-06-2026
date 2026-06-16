const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const WAV2LIP_PATH = process.env.WAV2LIP_PATH || '/root/libsync/Wav2Lip';
const CONDA_ENV    = process.env.WAV2LIP_ENV  || 'wav2lip';
const CONDA_PATH   = process.env.CONDA_PATH   || '/root/miniconda3';
const UPLOAD_DIR   = process.env.UPLOAD_DIR   || '/tmp/lipsync_uploads';
const OUTPUT_DIR   = process.env.OUTPUT_DIR   || '/tmp/lipsync_outputs';
const CHECKPOINT   = process.env.CHECKPOINT   || 'wav2lip.pth';

[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use('/outputs', express.static(OUTPUT_DIR));
app.use(express.static(path.join(__dirname, '../frontend/build')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|jpg|jpeg|png|webp|wav|mp3)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

const jobs = {};

function textToSpeech(script, audioPath, gender = 'female') {
  return new Promise((resolve, reject) => {
    const voice = gender === 'male' ? 'en+m3' : 'en+f3';
    const proc = spawn('espeak', [script, '--stdout', '-v', voice, '-s', '140', '-p', '50', '-a', '180']);
    const out = fs.createWriteStream(audioPath);
    proc.stdout.pipe(out);
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());
    out.on('finish', () => {
      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) resolve(audioPath);
      else reject(new Error('TTS produced empty audio'));
    });
    proc.on('error', reject);
    proc.on('close', code => { if (code !== 0) reject(new Error(`espeak failed: ${stderr}`)); });
  });
}

function runWav2Lip({ jobId, facePath, audioPath, outputPath }) {
  return new Promise((resolve, reject) => {
    const checkpointPath  = path.join(WAV2LIP_PATH, 'checkpoints', CHECKPOINT);
    const pythonBin       = path.join(CONDA_PATH, 'envs', CONDA_ENV, 'bin', 'python');
    const inferenceScript = path.join(WAV2LIP_PATH, 'inference.py');
    const args = [
      inferenceScript,
      '--checkpoint_path', checkpointPath,
      '--face',    facePath,
      '--audio',   audioPath,
      '--outfile', outputPath,
      '--nosmooth',
      '--resize_factor', '2'
    ];
    console.log(`[${jobId}] Spawning Wav2Lip...`);
    const proc = spawn(pythonBin, args, {
      cwd: WAV2LIP_PATH,
      env: { ...process.env, PATH: `${CONDA_PATH}/envs/${CONDA_ENV}/bin:${process.env.PATH}` }
    });
    proc.stdout.on('data', d => {
      const line = d.toString().trim();
      jobs[jobId].log += line + '\n';
      console.log(`[${jobId}]`, line);
      const match = line.match(/(\d+)\/(\d+)/);
      if (match) {
        const pct = Math.round((parseInt(match[1]) / parseInt(match[2])) * 90);
        jobs[jobId].progress = Math.max(jobs[jobId].progress, pct);
      }
    });
    proc.stderr.on('data', d => { jobs[jobId].log += d.toString(); });
    proc.on('close', code => {
      if (code === 0 && fs.existsSync(outputPath)) resolve(outputPath);
      else reject(new Error(`Wav2Lip exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function runPipeline(jobId, facePath, script, gender = 'female') {
  const audioPath  = path.join(UPLOAD_DIR, `${jobId}_audio.wav`);
  const outputPath = path.join(OUTPUT_DIR,  `${jobId}_output.mp4`);
  try {
    jobs[jobId].step = 'tts'; jobs[jobId].progress = 5;
    await textToSpeech(script, audioPath, gender);
    jobs[jobId].step = 'wav2lip'; jobs[jobId].progress = 10;
    await runWav2Lip({ jobId, facePath, audioPath, outputPath });
    jobs[jobId].status = 'done';
    jobs[jobId].progress = 100;
    jobs[jobId].videoUrl = `/outputs/${jobId}_output.mp4`;
    console.log(`[${jobId}] Done -> ${jobs[jobId].videoUrl}`);
    setTimeout(() => {
      [facePath, audioPath].forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch(_){} });
    }, 3600000);
  } catch (err) {
    jobs[jobId].status = 'error';
    jobs[jobId].message = err.message;
    console.error(`[${jobId}] Failed:`, err.message);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', wav2lip: WAV2LIP_PATH, conda_env: CONDA_ENV, checkpoint: CHECKPOINT });
});

app.post('/api/lipsync/generate', upload.single('avatar'), async (req, res) => {
  const { script, gender } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Avatar file required' });
  if (!script || !script.trim()) return res.status(400).json({ error: 'Script text required' });
  const jobId    = uuidv4();
  const facePath = req.file.path;
  const avatarPreview = path.join(OUTPUT_DIR, path.basename(facePath));
  fs.copyFileSync(facePath, avatarPreview);
  jobs[jobId] = { id: jobId, status: 'processing', step: 'queued', progress: 0, videoUrl: null, message: null, log: '', createdAt: new Date().toISOString() };
  res.status(202).json({ jobId, status: 'processing', avatarUrl: `/outputs/${path.basename(facePath)}` });
  runPipeline(jobId, facePath, script.trim(), gender || 'female');
});

app.get('/api/lipsync/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ jobId: job.id, status: job.status, progress: job.progress, videoUrl: job.videoUrl, message: job.message, step: job.step });
});

app.get('/api/jobs', (req, res) => {
  res.json(Object.values(jobs).map(j => ({ id: j.id, status: j.status, progress: j.progress, step: j.step, videoUrl: j.videoUrl, createdAt: j.createdAt })));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LipSync backend running on http://0.0.0.0:${PORT}`);
  console.log(`   Wav2Lip : ${WAV2LIP_PATH}`);
  console.log(`   Env     : ${CONDA_ENV}`);
});
