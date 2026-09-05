const express = require("express");

const controller = require("../controllers/project.controller");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

// El límite es alto a propósito: la vista compartida sondea cada 4 segundos
// (15 req/min por pestaña), así que 120/min deja lugar a varias pestañas
// detrás de la misma IP y aun así corta la fuerza bruta de tokens.
const shareRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120 });

// Público, sin auth (a tono con el resto de la API, que tampoco tiene) —
// pero a diferencia de /api/projects/:id, acá el identificador es un token
// random (no un id secuencial adivinable) y el service filtra
// share_enabled = 1, así que solo responde para proyectos explícitamente
// compartidos.
router.get("/:token", shareRateLimit, controller.getSharedProject);

module.exports = router;
