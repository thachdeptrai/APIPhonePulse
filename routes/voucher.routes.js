const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const adminMiddleware = require('../middlewares/admin.middleware'); // Đây là một đối tượng
const voucherController = require('../controllers/voucher.controller');

// Validation schemas
const applyVoucherSchema = validationSchemas.applyVoucher;
const createVoucherSchema = validationSchemas.createVoucher;

/**
 * @route   POST /api/vouchers/apply
 * @desc    Áp dụng mã giảm giá
 * @access  Private
 */
router.post('/apply', auth.authMiddleware, validateMiddleware(applyVoucherSchema), voucherController.applyVoucher);

// ✅ Đã thêm: Route mới cho người dùng
/**
 * @route   GET /api/vouchers
 * @desc    Lấy danh sách mã giảm giá hợp lệ cho người dùng
 * @access  Private
 */
router.get('/', auth.authMiddleware, voucherController.getAvailableVouchers);

//--------------------------------------------------------------------------------------------------

/**
 * @route   Các route quản lý yêu cầu xác thực Admin
 * @access  Private/Admin
 */
router.use('/admin', adminMiddleware.authenticateAdmin); // ✅ Đã sửa: Sử dụng đúng hàm authenticateAdmin từ đối tượng

/**
 * @route   GET /api/admin/vouchers
 * @desc    Lấy danh sách tất cả mã giảm giá
 * @access  Private/Admin
 */
router.get('/vouchers', voucherController.getAll);

/**
 * @route   POST /api/admin/vouchers
 * @desc    Tạo mã giảm giá mới
 * @access  Private/Admin
 */
router.post('/vouchers', validateMiddleware(createVoucherSchema), voucherController.create);

/**
 * @route   PUT /api/admin/vouchers/:id
 * @desc    Cập nhật thông tin mã giảm giá
 * @access  Private/Admin
 */
router.put('/vouchers/:id', voucherController.update);

/**
 * @route   DELETE /api/admin/vouchers/:id
 * @desc    Xóa mã giảm giá
 * @access  Private/Admin
 */
router.delete('/vouchers/:id', voucherController.remove);

//--------------------------------------------------------------------------------------------------

module.exports = router;