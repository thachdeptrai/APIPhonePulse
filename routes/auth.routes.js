const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");

// Route login cho cả Google và Facebook
router.post("/login-social", AuthController.socialLogin);

module.exports = router;
