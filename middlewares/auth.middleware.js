// Middleware kiểm tra token (nếu có)
const UserUtils = require('../utils/users.util');
const UserService = require('../services/user.service');

/**
 * Middleware xác thực JWT token
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp'
            });
        }

        // Kiểm tra format: "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        // Verify token
        const decoded = UserUtils.verifyToken(token);
        req.user = decoded; 
        // Lấy thông tin user từ database
        const user = await UserService.getUserById(decoded._id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User không tồn tại'
            });
        }

        // Kiểm tra user có active không
        if (!UserUtils.isActiveUser(user)) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Lưu thông tin user vào request
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

/**
 * Middleware kiểm tra quyền admin
 */
const adminMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa đăng nhập'
            });
        }

        if (!UserUtils.isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền'
        });
    }
};

/**
 * Middleware kiểm tra user đã verify email chưa
 */
const verifiedMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa đăng nhập'
            });
        }

        if (!UserUtils.isVerifiedUser(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Vui lòng xác minh email trước khi sử dụng tính năng này'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra xác minh'
        });
    }
};

/**
 * Middleware tùy chọn - không bắt buộc đăng nhập
 * Nếu có token thì verify, không có thì bỏ qua
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            req.user = null;
            return next();
        }

        try {
            const decoded = UserUtils.verifyToken(token);
            const user = await UserService.getUserById(decoded._id);
            
            if (user && UserUtils.isActiveUser(user)) {
                req.user = user;
            } else {
                req.user = null;
            }
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
    optionalAuthMiddleware
};