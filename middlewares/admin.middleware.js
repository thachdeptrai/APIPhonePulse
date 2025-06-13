const jwt = require('jsonwebtoken');
const Admin = require('../models/User'); // Giả sử bạn có model Admin

// Middleware xác thực admin
const authenticateAdmin = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    // Kiểm tra format "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7, authHeader.length) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Tìm admin trong database
    const admin = await Admin.findById(decoded._id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin không tồn tại'
      });
    }

    // Kiểm tra admin có active không
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản admin đã bị vô hiệu hóa'
      });
    }

    // Gán thông tin admin vào request để sử dụng trong controller
    req.admin = {
      id: admin._id,
      username: admin.name,
      email: admin.email,
      role: admin.role
    };

    next();
    
  } catch (error) {
    console.error('Lỗi xác thực admin:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực',
      error: error.message
    });
  }
};

// Middleware kiểm tra quyền admin (role-based)
const authorizeAdmin = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      // Nếu không yêu cầu role cụ thể, chỉ cần là admin
      if (requiredRoles.length === 0) {
        return next();
      }

      // Kiểm tra admin có role phù hợp không
      const adminRole = req.admin.role;
      
      if (!adminRole || !requiredRoles.includes(adminRole)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập tính năng này'
        });
      }

      next();
      
    } catch (error) {
      console.error('Lỗi kiểm tra quyền admin:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền',
        error: error.message
      });
    }
  };
};

// Middleware validate query parameters cho pagination
const validatePagination = (req, res, next) => {
  try {
    // Lấy và validate page
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;
    
    // Lấy và validate limit
    let limit = parseInt(req.query.limit) || 20;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Giới hạn tối đa 100 items per page

    // Gán lại vào query để sử dụng trong controller
    req.query.page = page;
    req.query.limit = limit;

    next();
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Tham số phân trang không hợp lệ',
      error: error.message
    });
  }
};

// Middleware validate date range
const validateDateRange = (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Nếu có startDate, validate format
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'startDate không hợp lệ. Định dạng: YYYY-MM-DD'
        });
      }
      req.query.startDate = start;
    }

    // Nếu có endDate, validate format
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'endDate không hợp lệ. Định dạng: YYYY-MM-DD'
        });
      }
      req.query.endDate = end;
    }

    // Nếu có cả startDate và endDate, kiểm tra logic
    if (startDate && endDate && req.query.startDate > req.query.endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate phải nhỏ hơn endDate'
      });
    }

    next();
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi validate khoảng thời gian',
      error: error.message
    });
  }
};

// Middleware rate limiting cho admin APIs (tùy chọn)
const rateLimitAdmin = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map(); // Lưu trữ số request của mỗi admin

  return (req, res, next) => {
    try {
      const adminId = req.admin._id;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Lấy lịch sử request của admin
      if (!requests.has(adminId)) {
        requests.set(adminId, []);
      }

      const adminRequests = requests.get(adminId);
      
      // Lọc bỏ các request cũ (ngoài window)
      const recentRequests = adminRequests.filter(time => time > windowStart);
      
      // Kiểm tra có vượt quá giới hạn không
      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: `Quá nhiều request. Giới hạn ${maxRequests} request trong ${windowMs/1000}s`,
          retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
        });
      }

      // Thêm request hiện tại
      recentRequests.push(now);
      requests.set(adminId, recentRequests);

      // Cleanup requests map định kỳ để tránh memory leak
      if (Math.random() < 0.01) { // 1% chance cleanup
        for (const [id, times] of requests.entries()) {
          const validTimes = times.filter(time => time > windowStart);
          if (validTimes.length === 0) {
            requests.delete(id);
          } else {
            requests.set(id, validTimes);
          }
        }
      }

      next();
      
    } catch (error) {
      console.error('Lỗi rate limiting:', error);
      next(); // Không block request nếu có lỗi
    }
  };
};

module.exports = {
  authenticateAdmin,
  authorizeAdmin,
  validatePagination,
  validateDateRange,
  rateLimitAdmin
};