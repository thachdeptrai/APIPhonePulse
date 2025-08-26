const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// 📌 Gửi OTP
router.post('/send-otp', otpController.sendOtpToEmail);

// ❌ Bỏ verifyOtp (không cần nữa)

module.exports = router;
