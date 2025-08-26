// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const {validateMiddleware} = require('../middlewares/validate.middleware');
const { validationSchemas } = require('../middlewares/validate.middleware');

// Sử dụng validation schemas từ validateMiddleware
const registerSchema = validationSchemas.register;
const loginSchema = validationSchemas.login;
const updateProfileSchema = validationSchemas.updateProfile;
const changePasswordSchema = validationSchemas.changePassword;

// POST /api/users/update-fcm-token
router.post('/update-fcm-token', UserController.updateFcmToken);

// ================== PUBLIC ROUTES ==================
/**
 * @route   POST /api/users/register
 * @desc    Đăng ký user mới
 * @access  Public
 */
router.post('/register', 
    validateMiddleware(registerSchema), 
    UserController.register
);

/**
 * @route   POST /api/users/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post('/login', 
    validateMiddleware(loginSchema), 
    UserController.login
);

// ================== PROTECTED ROUTES ==================
// Tất cả routes bên dưới đều cần authentication
// router.use(authMiddleware);

/**
 * @route   GET /api/users/profile
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private
 */
router.get('/profile',authMiddleware, UserController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật profile của user hiện tại
 * @access  Private
 */
router.put('/profile', 
    authMiddleware, // them dong nay ne
    validateMiddleware(updateProfileSchema), 
    UserController.updateProfile
);


/**
 * @route   PUT /api/users/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 */
router.put(
  '/change-password',
  authMiddleware, // 👈 thêm middleware xác thực JWT
  validateMiddleware(changePasswordSchema),
  UserController.changePassword
);

/**
 * @route   PUT /api/users/verify-self
 * @desc    Tự xác minh email
 * @access  Private
 */
router.put('/verify-self', UserController.verifySelf);

/**
 * @route   DELETE /api/users/delete-self
 * @desc    Tự xóa tài khoản
 * @access  Private
 */
router.delete('/delete-self', UserController.deleteSelf);

/**
 * @route   POST /api/users/logout
 * @desc    Đăng xuất
 * @access  Private
 */
router.post('/logout', UserController.logout);

// ================== ADMIN ROUTES ==================

/**
 * @route   GET /api/users/stats
 * @desc    Lấy thống kê users
 * @access  Private (Admin only)
 */
router.get('/stats', adminMiddleware, UserController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách tất cả users với phân trang và tìm kiếm
 * @access  Private (Admin only)
 * @query   page, limit, sort, order, search, status, role, is_verified
 */
router.get('/', adminMiddleware, UserController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Lấy thông tin user theo ID
 * @access  Private (Admin hoặc chính user đó)
 */
router.get('/:id', adminMiddleware, UserController.getUserById); // Lưu ý: Cần điều chỉnh nếu user tự xem profile

/**
 * @route   PUT /api/users/:id
 * @desc    Cập nhật user theo ID
 * @access  Private (Admin only)
 */
router.put('/:id', 
    adminMiddleware,
    validateMiddleware({
        ...updateProfileSchema,
        role: {
            optional: true,
            isBoolean: {
                errorMessage: 'Role phải là boolean'
            }
        },
        status: {
            optional: true,
            isBoolean: {
                errorMessage: 'Status phải là boolean'
            }
        },
        is_verified: {
            optional: true,
            isBoolean: {
                errorMessage: 'is_verified phải là boolean'
            }
        }
    }), 
    UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Xóa user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', adminMiddleware, UserController.deleteUser);

/**
 * @route   PUT /api/users/:id/restore
 * @desc    Khôi phục user
 * @access  Private (Admin only)
 */
router.put('/:id/restore', adminMiddleware, UserController.restoreUser);

/**
 * @route   PUT /api/users/:id/verify
 * @desc    Xác minh user
 * @access  Private (Admin only)
 */
router.put('/:id/verify', adminMiddleware, UserController.verifyUser);

module.exports = router;