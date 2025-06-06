const User = require('../models/User');
const bcrypt = require('bcrypt'); // Dùng để mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Dùng để tạo token JWT cho đăng nhập

// ===== Đăng ký người dùng =====
exports.register = async (req, res) => {
  const { name, email, password, phone, avatar_url } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

    // Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const user = new User({ name, email, password_hash, phone, avatar_url });

    // Lưu vào database
    await user.save();

    // Phản hồi thành công
    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    // Trả về lỗi nếu có
    res.status(500).json({ error: err.message });
  }
};

// ===== Đăng nhập người dùng =====
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

    // Tạo token JWT có chứa thông tin người dùng
    const token = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // token hết hạn sau 1 ngày
    );

    // Phản hồi gồm token và thông tin người dùng (trừ mật khẩu)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (err) {
    // Trả về lỗi nếu có
    res.status(500).json({ error: err.message });
  }
};

// ===== Lấy danh sách tất cả người dùng =====
exports.getUsers = async (req, res) => {
  try {
    // Tìm tất cả người dùng và loại trừ field password_hash
    const users = await User.find({}, '-password_hash');
    res.json(users);
  } catch (err) {
    // Trả về lỗi nếu có
    res.status(500).json({ error: err.message });
  }
};
