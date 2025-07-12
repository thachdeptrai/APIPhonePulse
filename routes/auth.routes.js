const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");

router.post("/login-google", AuthController.socialLogin);

module.exports = router;
