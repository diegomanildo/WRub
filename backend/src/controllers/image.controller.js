const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "../../uploads/images");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Formato de imagen no soportado"));
    }
    cb(null, true);
  },
}).single("image");

function uploadImage(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!req.file) {
      const error = new Error("No se recibió ninguna imagen");
      error.status = 400;
      return next(error);
    }

    res.status(201).json({
      url: `/uploads/images/${req.file.filename}`,
    });
  });
}

module.exports = {
  uploadImage,
};
