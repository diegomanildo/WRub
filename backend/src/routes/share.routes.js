const express = require("express");

const controller = require("../controllers/project.controller");

const router = express.Router();

// Público, sin auth (a tono con el resto de la API, que tampoco tiene) —
// pero a diferencia de /api/projects/:id, acá el identificador es un token
// random (no un id secuencial adivinable) y el service filtra
// share_enabled = 1, así que solo responde para proyectos explícitamente
// compartidos.
router.get("/:token", controller.getSharedProject);

module.exports = router;
