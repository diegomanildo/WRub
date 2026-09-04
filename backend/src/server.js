require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const projectRoutes = require("./routes/project.routes");
const audioRoutes = require("./routes/audio.routes");
const imageRoutes = require("./routes/image.routes");
const shareRoutes = require("./routes/share.routes");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Archivos de audio subidos por los usuarios (música asociada a párrafos).
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/projects", projectRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/share", shareRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`Backend ejecutándose en http://localhost:${PORT}`);
});
