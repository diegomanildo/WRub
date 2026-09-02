const express = require("express");

const controller = require("../controllers/audio.controller");

const router = express.Router();

router.post("/", controller.uploadAudio);

module.exports = router;
