const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "../../uploads/audio");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Formato de audio no soportado"));
    }
    cb(null, true);
  },
}).single("audio");

function uploadAudio(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!req.file) {
      const error = new Error("No se recibió ningún archivo de audio");
      error.status = 400;
      return next(error);
    }

    res.status(201).json({
      url: `/uploads/audio/${req.file.filename}`,
      title: path.parse(req.file.originalname).name,
    });
  });
}

module.exports = {
  uploadAudio,
};
