// controllers/userController.js
const UserService = require("../services/user.service");
const UserUtils = require("../utils/users.util");
<<<<<<< HEAD
const User = require("../models/User");
=======
const OTP = require('../models/OTP'); // ✅ thêm dòng này đầu file
const User = require("../models/User");

>>>>>>> 038f7f43bf7830e90eb98eed1b0a553925228317

class UserController {
  static async updateFcmToken(req, res) {
    const { userId, fcm_token } = req.body;

    if(!userId || !fcm_token) {
        return res.status(400).json({ success: false, message: 'Missing userId or fcm_token' });
    }

    try {
        const user = await User.findByIdAndUpdate(userId, { fcm_token }, { new: true });
        if(!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, message: 'FCM token updated', user });
    } catch(err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
   /**
   * Đăng ký user mới
   * POST /api/users/register
   */
    static async register(req, res) {
  try {
    const { name, email, password, otp } = req.body;
    console.log("[register] Nhận yêu cầu đăng ký:", { name, email });

    // Validate dữ liệu cơ bản
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Tên không hợp lệ (ít nhất 3 ký tự)." });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: "OTP không hợp lệ." });
    }

    // 🔑 Kiểm tra OTP
    const otpRecord = await OTP.findOne({ email, code: otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP không đúng." });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP đã hết hạn. Vui lòng gửi lại OTP." });
    }

    // Check email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại." });
    }

    // ✅ Tạo user
    const newUser = await UserService.createUser({ name, email, password });

    // 🧹 Xoá OTP sau khi dùng
    await OTP.deleteMany({ email });

    console.log("[register] ✅ Đăng ký thành công:", email);

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: newUser,
    });

  } catch (error) {
    console.error("[register] Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký.",
      error: error.message,
    });
  }
}



  /**
   * Đăng nhập
   * POST /api/users/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await UserService.login(email, password);
      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy thông tin profile của user hiện tại
   * GET /api/users/profile
   */
  static async getProfile(req, res) {
  try {
    const userId = req.user?._id; // Lấy từ middleware auth

    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin profile thành công",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


  /**
   * Cập nhật profile của user hiện tại
   * PUT /api/users/profile
   */
static async updateProfile(req, res) {
  try {
    const userId = req.user._id;

    // Chỉ cho phép update các field sau
    const allowedFields = ["name", "phone", "address", "gender", "birthday"];
    const updateData = {};

    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    }

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: updatedUser
    });
  } catch (err) {
    console.error("Lỗi updateProfile:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
}


  /**
   * Đổi mật khẩu
   * PUT /api/users/change-password
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      const result = await UserService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy danh sách tất cả users (Admin only)
   * GET /api/users
   */
  static async getUsers(req, res) {
    try {
      // Kiểm tra quyền admin
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const queryOptions = {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort,
        order: req.query.order,
        search: req.query.search,
        status:
          req.query.status === "true"
            ? true
            : req.query.status === "false"
            ? false
            : undefined,
        role:
          req.query.role === "true"
            ? true
            : req.query.role === "false"
            ? false
            : undefined,
        is_verified:
          req.query.is_verified === "true"
            ? true
            : req.query.is_verified === "false"
            ? false
            : undefined,
      };

      const result = await UserService.getUsers(queryOptions);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách users thành công",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy thông tin user theo ID (Admin only hoặc chính user đó)
   * GET /api/users/:id
   */
  static async getUserById(req, res) {
    try {
      // Kiểm tra quyền admin hoặc chính user đó
      if (!UserUtils.isAdmin(req.user) && req.user.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const user = await UserService.getUserById(req.params.id);

      res.status(200).json({
        success: true,
        message: "Lấy thông tin user thành công",
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cập nhật user theo ID (Admin only)
   * PUT /api/users/:id
   */
  static async updateUser(req, res) {
    try {
      // Chỉ admin mới được cập nhật user khác
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const userId = req.params.id;
      const updateData = req.body;

      const updatedUser = await UserService.updateUser(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Cập nhật user thành công",
        data: updatedUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Xóa user (soft delete) (Admin only)
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res) {
    try {
      // Chỉ admin mới được xóa user
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      // Không cho phép admin tự xóa chính mình
      if (req.user._id === req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa chính mình",
        });
      }

      const result = await UserService.deleteUser(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Khôi phục user (Admin only)
   * PUT /api/users/:id/restore
   */
  static async restoreUser(req, res) {
    try {
      // Chỉ admin mới được khôi phục user
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const restoredUser = await UserService.restoreUser(req.params.id);

      res.status(200).json({
        success: true,
        message: "Khôi phục user thành công",
        data: restoredUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Xác minh user (Admin only)
   * PUT /api/users/:id/verify
   */
  static async verifyUser(req, res) {
    try {
      // Chỉ admin mới được xác minh user
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const verifiedUser = await UserService.verifyUser(req.params.id);

      res.status(200).json({
        success: true,
        message: "Xác minh user thành công",
        data: verifiedUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Lấy thống kê users (Admin only)
   * GET /api/users/stats
   */
  static async getUserStats(req, res) {
    try {
      // Chỉ admin mới được xem thống kê
      if (!UserUtils.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const stats = await UserService.getUserStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê thành công",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tự xác minh email (User tự xác minh)
   * PUT /api/users/verify-self
   */
  static async verifySelf(req, res) {
    try {
      const userId = req.user._id;
      const verifiedUser = await UserService.verifyUser(userId);

      res.status(200).json({
        success: true,
        message: "Xác minh email thành công",
        data: verifiedUser,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Tự xóa tài khoản (User tự xóa)
   * DELETE /api/users/delete-self
   */
  static async deleteSelf(req, res) {
    try {
      const userId = req.user._id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu để xác nhận",
        });
      }

      // Lấy thông tin user để kiểm tra password
      const user = await UserService.getUserById(userId);
      const isPasswordValid = await UserUtils.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu không đúng",
        });
      }

      const result = await UserService.deleteUser(userId);

      res.status(200).json({
        success: true,
        message: "Xóa tài khoản thành công",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Đăng xuất (Xóa token phía client)
   * POST /api/users/logout
   */
  static async logout(req, res) {
    try {
      // Trong thực tế, có thể lưu token vào blacklist
      // Ở đây chỉ trả về thông báo thành công
      res.status(200).json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = UserController;
