const express = require("express");

const controller = require("../controllers/image.controller");

const router = express.Router();

router.post("/", controller.uploadImage);

module.exports = router;
