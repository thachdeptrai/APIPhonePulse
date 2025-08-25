// controllers/otpController.js
require('dotenv').config();
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ---------------------
// 📌 Gửi OTP
// ---------------------
// ---------------------
// 📌 Gửi OTP
// ---------------------
exports.sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[sendOtpToEmail] Yêu cầu gửi OTP cho: ${email}`);

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
    }

    // Check email tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại. Vui lòng dùng email khác.' });
    }

    // Sinh OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Lưu OTP
    await OTP.deleteMany({ email });
    await OTP.create({ email, code, expiresAt });

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `PhonePulse <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác minh OTP',
      text: `Mã OTP của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("[sendOtpToEmail] Lỗi gửi email:", err);
        return res.status(500).json({ success: false, message: 'Không thể gửi email.' });
      }

      console.log(`[sendOtpToEmail] ✅ OTP gửi thành công tới ${email}: ${code}`);
      return res.status(200).json({
        success: true,
        message: 'OTP đã được gửi tới email của bạn.',
      });
    });

  } catch (err) {
    console.error('[sendOtpToEmail] ❌ Lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

