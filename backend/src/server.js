require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const projectRoutes = require("./routes/project.routes");
const audioRoutes = require("./routes/audio.routes");
const imageRoutes = require("./routes/image.routes");
const shareRoutes = require("./routes/share.routes");

// Al arrancar: si la base ya tenía proyectos de antes del índice full-text,
// se reconstruye una vez (si no, buscar por contenido no encontraría nada
// de lo escrito hasta ahora).
require("./services/search.service").reindexIfEmpty();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
// El límite default de express.json() son 100 kb, y el body de PATCH
// /api/projects/:id lleva el HTML completo del documento: un texto largo
// con formato lo pasa y el autoguardado empezaría a fallar con 413.
app.use(express.json({ limit: "5mb" }));

// Archivos subidos por los usuarios (música asociada a párrafos e imágenes
// del documento). `nosniff` para que el navegador respete el Content-Type
// declarado, y CSP en sandbox porque entre los formatos aceptados está
// image/svg+xml, que es un documento y puede traer scripts adentro: así un
// SVG subido no ejecuta nada al abrirlo directo desde /uploads.
app.use(
  "/uploads",
  (req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'none'; sandbox");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

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
