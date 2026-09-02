const express = require("express");

const controller = require("../controllers/project.controller");

const router = express.Router();

router.get("/", controller.getProjects);

router.get("/:id", controller.getProject);

router.post("/", controller.createProject);

router.patch("/:id", controller.updateProject);

router.delete("/:id", controller.deleteProject);

// Compartir (link de solo lectura). Separado de PATCH /:id a propósito: son
// acciones distintas (activar/desactivar/rotar un token) de "editar el
// proyecto", así el front no tiene que mandar el resto de los campos para
// tocar el share.
router.post("/:id/share", controller.enableShare);

router.delete("/:id/share", controller.disableShare);

router.post("/:id/share/rotate", controller.rotateShare);

module.exports = router;
