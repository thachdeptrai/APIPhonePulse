const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const isActiveUser = (user) => user.status === true;
const isAdmin = (user) => user.role === true;
const isVerifiedUser = (user) => user.is_verified === true;

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: "Token không được cung cấp" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!token) return res.status(401).json({ success: false, message: "Token không hợp lệ" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ success: false, message: "User không tồn tại" });
    if (!isActiveUser(user)) return res.status(401).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Token không hợp lệ" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token đã hết hạn" });
    }
    return res.status(500).json({ success: false, message: "Lỗi xác thực" });
  }
};

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền" });
  }
};

const verifiedMiddleware = (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    if (!isVerifiedUser(req.user)) return res.status(403).json({ success: false, message: "Vui lòng xác minh email trước khi sử dụng tính năng này" });
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra xác minh" });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      req.user = user && isActiveUser(user) ? user : null;
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  verifiedMiddleware,
  optionalAuthMiddleware,
};
