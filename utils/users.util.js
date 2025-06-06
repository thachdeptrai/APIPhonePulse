// utils/userUtils.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

class UserUtils {
    /**
     * Mã hóa mật khẩu
     * @param {string} password - Mật khẩu gốc
     * @returns {Promise<string>} Mật khẩu đã mã hóa
     */
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * So sánh mật khẩu
     * @param {string} password - Mật khẩu gốc
     * @param {string} hashedPassword - Mật khẩu đã mã hóa
     * @returns {Promise<boolean>} Kết quả so sánh
     */
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Tạo JWT token
     * @param {Object} payload - Dữ liệu token
     * @param {string} expiresIn - Thời gian hết hạn (default: '7d')
     * @returns {string} JWT token
     */
    static generateToken(payload, expiresIn = '7d') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    /**
     * Xác thực JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded payload
     */
    static verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    /**
     * Validate email format
     * @param {string} email - Email để validate
     * @returns {boolean} Kết quả validate
     */
    static isValidEmail(email) {
        return validator.isEmail(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password để validate
     * @returns {Object} Kết quả validate và thông báo lỗi
     */
    static validatePassword(password) {
        const errors = [];
        
        if (!password || password.length < 6) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một chữ cái thường');
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một chữ cái hoa');
        }
        
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Mật khẩu phải chứa ít nhất một số');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate phone number
     * @param {string|number} phone - Số điện thoại
     * @returns {boolean} Kết quả validate
     */
    static isValidPhone(phone) {
        const phoneStr = phone.toString();
        return validator.isMobilePhone(phoneStr, 'vi-VN') || 
               /^[0-9]{10,11}$/.test(phoneStr);
    }

    /**
     * Sanitize user data (loại bỏ password khỏi response)
     * @param {Object} user - User object
     * @returns {Object} User object đã sanitize
     */
    static sanitizeUser(user) {
        if (!user) return null;
        
        const userObj = user.toObject ? user.toObject() : user;
        const { password, ...sanitizedUser } = userObj;
        return sanitizedUser;
    }

    /**
     * Tạo query filter cho tìm kiếm
     * @param {Object} queryOptions - Options từ request
     * @returns {Object} MongoDB filter object
     */
    static buildSearchFilter(queryOptions) {
        const filter = {};
        
        // Tìm kiếm theo tên hoặc email
        if (queryOptions.search) {
            filter.$or = [
                { name: { $regex: queryOptions.search, $options: 'i' } },
                { email: { $regex: queryOptions.search, $options: 'i' } }
            ];
        }

        // Lọc theo status
        if (typeof queryOptions.status === 'boolean') {
            filter.status = queryOptions.status;
        }

        // Lọc theo role
        if (typeof queryOptions.role === 'boolean') {
            filter.role = queryOptions.role;
        }

        // Lọc theo is_verified
        if (typeof queryOptions.is_verified === 'boolean') {
            filter.is_verified = queryOptions.is_verified;
        }

        return filter;
    }

    /**
     * Tạo sort object cho MongoDB
     * @param {string} sort - Trường để sort
     * @param {string} order - Thứ tự sort (asc/desc)
     * @returns {Object} MongoDB sort object
     */
    static buildSortOptions(sort = 'created_date', order = 'desc') {
        const sortObj = {};
        sortObj[sort] = order === 'asc' ? 1 : -1;
        return sortObj;
    }

    /**
     * Tính toán pagination
     * @param {number} page - Số trang
     * @param {number} limit - Số item mỗi trang
     * @returns {Object} Skip và limit values
     */
    static calculatePagination(page = 1, limit = 10) {
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;
        
        return {
            skip,
            limit: limitNum,
            page: pageNum
        };
    }

    /**
     * Format pagination result
     * @param {Array} data - Dữ liệu
     * @param {number} totalItems - Tổng số items
     * @param {number} page - Trang hiện tại
     * @param {number} limit - Số items mỗi trang
     * @returns {Object} Formatted pagination result
     */
    static formatPaginationResult(data, totalItems, page, limit) {
        const totalPages = Math.ceil(totalItems / limit);
        
        return {
            data,
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    }

    /**
     * Generate verification code
     * @param {number} length - Độ dài code (default: 6)
     * @returns {string} Verification code
     */
    static generateVerificationCode(length = 6) {
        return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
    }

    /**
     * Check if user is admin
     * @param {Object} user - User object
     * @returns {boolean} True if admin
     */
    static isAdmin(user) {
        return user && user.role === true;
    }

    /**
     * Check if user is active
     * @param {Object} user - User object
     * @returns {boolean} True if active
     */
    static isActiveUser(user) {
        return user && user.status === true;
    }

    /**
     * Check if user is verified
     * @param {Object} user - User object  
     * @returns {boolean} True if verified
     */
    static isVerifiedUser(user) {
        return user && user.is_verified === true;
    }
}

module.exports = UserUtils;