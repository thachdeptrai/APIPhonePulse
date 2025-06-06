// services/userService.js
const User = require('../models/User');
const UserUtils = require('../utils/users.util');

class UserService {
    /**
     * Tạo user mới
     * @param {Object} userData - Dữ liệu user
     * @returns {Promise<Object>} User đã tạo
     */
    static async createUser(userData) {
        try {
            // Validate email
            if (!UserUtils.isValidEmail(userData.email)) {
                throw new Error('Email không hợp lệ');
            }

            // Validate password
            const passwordValidation = UserUtils.validatePassword(userData.password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join(', '));
            }

            // Validate phone nếu có
            if (userData.phone && !UserUtils.isValidPhone(userData.phone)) {
                throw new Error('Số điện thoại không hợp lệ');
            }

            // Kiểm tra email đã tồn tại
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('Email đã được sử dụng');
            }

            // Mã hóa password
            const hashedPassword = await UserUtils.hashPassword(userData.password);
            
            // Tạo user mới
            const newUser = new User({
                ...userData,
                password: hashedPassword,
                modified_date: new Date()
            });

            const savedUser = await newUser.save();
            return UserUtils.sanitizeUser(savedUser);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Đăng nhập
     * @param {string} email - Email
     * @param {string} password - Password
     * @returns {Promise<Object>} User info và token
     */
    static async login(email, password) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Email và mật khẩu là bắt buộc');
            }

            if (!UserUtils.isValidEmail(email)) {
                throw new Error('Email không hợp lệ');
            }

            // Tìm user
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('Email hoặc mật khẩu không đúng');
            }

            // Kiểm tra user có active không
            if (!UserUtils.isActiveUser(user)) {
                throw new Error('Tài khoản đã bị vô hiệu hóa');
            }

            // Kiểm tra password
            const isPasswordValid = await UserUtils.comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Email hoặc mật khẩu không đúng');
            }

            // Tạo token
            const token = UserUtils.generateToken({
                id: user._id,
                email: user.email,
                role: user.role
            });

            return {
                user: UserUtils.sanitizeUser(user),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy user theo ID
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} User data
     */
    static async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }
            return UserUtils.sanitizeUser(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy user theo email
     * @param {string} email - Email của user
     * @returns {Promise<Object>} User data
     */
    static async getUserByEmail(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }
            return UserUtils.sanitizeUser(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật user
     * @param {string} userId - ID của user
     * @param {Object} updateData - Dữ liệu cập nhật
     * @returns {Promise<Object>} User đã cập nhật
     */
    static async updateUser(userId, updateData) {
        try {
            // Loại bỏ các field không được phép cập nhật
            const { password, created_date, ...allowedUpdates } = updateData;

            // Validate email nếu có thay đổi
            if (allowedUpdates.email) {
                if (!UserUtils.isValidEmail(allowedUpdates.email)) {
                    throw new Error('Email không hợp lệ');
                }
                
                // Kiểm tra email đã tồn tại (trừ user hiện tại)
                const existingUser = await User.findOne({ 
                    email: allowedUpdates.email,
                    _id: { $ne: userId }
                });
                if (existingUser) {
                    throw new Error('Email đã được sử dụng');
                }
            }

            // Validate phone nếu có
            if (allowedUpdates.phone && !UserUtils.isValidPhone(allowedUpdates.phone)) {
                throw new Error('Số điện thoại không hợp lệ');
            }

            // Cập nhật modified_date
            allowedUpdates.modified_date = new Date();

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                allowedUpdates,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                throw new Error('Không tìm thấy người dùng');
            }

            return UserUtils.sanitizeUser(updatedUser);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Đổi mật khẩu
     * @param {string} userId - ID của user
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @param {string} newPassword - Mật khẩu mới
     * @returns {Promise<Object>} Thông báo thành công
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Validate input
            if (!currentPassword || !newPassword) {
                throw new Error('Mật khẩu hiện tại và mật khẩu mới là bắt buộc');
            }

            // Validate new password
            const passwordValidation = UserUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join(', '));
            }

            // Tìm user
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }

            // Kiểm tra current password
            const isCurrentPasswordValid = await UserUtils.comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Mật khẩu hiện tại không đúng');
            }

            // Mã hóa new password
            const hashedNewPassword = await UserUtils.hashPassword(newPassword);

            // Cập nhật password
            await User.findByIdAndUpdate(userId, {
                password: hashedNewPassword,
                modified_date: new Date()
            });

            return { message: 'Đổi mật khẩu thành công' };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa user (soft delete - set status = false)
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} Thông báo thành công
     */
    static async deleteUser(userId) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    status: false,
                    modified_date: new Date()
                },
                { new: true }
            );

            if (!updatedUser) {
                throw new Error('Không tìm thấy người dùng');
            }

            return { message: 'Xóa người dùng thành công' };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Khôi phục user
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} User đã khôi phục
     */
    static async restoreUser(userId) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    status: true,
                    modified_date: new Date()
                },
                { new: true }
            );

            if (!updatedUser) {
                throw new Error('Không tìm thấy người dùng');
            }

            return UserUtils.sanitizeUser(updatedUser);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách users với phân trang và tìm kiếm
     * @param {Object} queryOptions - Options cho query
     * @returns {Promise<Object>} Danh sách users với pagination
     */
    static async getUsers(queryOptions = {}) {
        try {
            // Tạo filter
            const filter = UserUtils.buildSearchFilter(queryOptions);
            
            // Tạo sort options
            const sort = UserUtils.buildSortOptions(queryOptions.sort, queryOptions.order);
            
            // Tính pagination
            const { skip, limit, page } = UserUtils.calculatePagination(
                queryOptions.page, 
                queryOptions.limit
            );

            // Query users
            const [users, totalItems] = await Promise.all([
                User.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(filter)
            ]);

            // Sanitize users
            const sanitizedUsers = users.map(user => UserUtils.sanitizeUser(user));

            // Format kết quả
            return UserUtils.formatPaginationResult(sanitizedUsers, totalItems, page, limit);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xác minh email user
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} User đã xác minh
     */
    static async verifyUser(userId) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    is_verified: true,
                    modified_date: new Date()
                },
                { new: true }
            );

            if (!updatedUser) {
                throw new Error('Không tìm thấy người dùng');
            }

            return UserUtils.sanitizeUser(updatedUser);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Thống kê users
     * @returns {Promise<Object>} Thống kê
     */
    static async getUserStats() {
        try {
            const [
                totalUsers,
                activeUsers,
                inactiveUsers,
                verifiedUsers,
                unverifiedUsers,
                adminUsers,
                regularUsers
            ] = await Promise.all([
                User.countDocuments({}),
                User.countDocuments({ status: true }),
                User.countDocuments({ status: false }),
                User.countDocuments({ is_verified: true }),
                User.countDocuments({ is_verified: false }),
                User.countDocuments({ role: true }),
                User.countDocuments({ role: false })
            ]);

            return {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
                verified: verifiedUsers,
                unverified: unverifiedUsers,
                admin: adminUsers,
                regular: regularUsers
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserService;