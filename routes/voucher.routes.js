const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const voucherController = require('../controllers/voucher.controller');

// Validation schemas
const applyVoucherSchema = validationSchemas.applyVoucher;
const createVoucherSchema = validationSchemas.createVoucher;

/**
 * @route   POST /api/vouchers/apply
 * @desc    Áp dụng mã giảm giá
 * @access  Private
 */
router.post('/apply', validateMiddleware(applyVoucherSchema), voucherController.applyVoucher);

/**
 * Áp dụng middleware xác thực và quyền admin cho các route quản lý
 * @middleware auth, adminMiddleware
 */
// router.use(auth, adminMiddleware);

/**
 * @route   GET /api/admin/vouchers
 * @desc    Lấy danh sách tất cả mã giảm giá
 * @access  Private/Admin
 */
router.get('/admin/vouchers', voucherController.getAll);

/**
 * @route   POST /api/admin/vouchers
 * @desc    Tạo mã giảm giá mới
 * @access  Private/Admin
 */
router.post('/admin/vouchers', validateMiddleware(createVoucherSchema), voucherController.create);

/**
 * @route   PUT /api/admin/vouchers/:id
 * @desc    Cập nhật thông tin mã giảm giá
 * @access  Private/Admin
 */
router.put('/admin/vouchers/:id', voucherController.update);

/**
 * @route   DELETE /api/admin/vouchers/:id
 * @desc    Xóa mã giảm giá
 * @access  Private/Admin
 */
router.delete('/admin/vouchers/:id', voucherController.remove);

module.exports = router;