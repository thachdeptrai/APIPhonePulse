const express = require('express');
const router = express.Router();
// const auth = require('../middlewares/auth.middleware'); // Dòng này có thể không cần nếu bạn chỉ import authMiddleware, adminMiddleware
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const cartController = require('../controllers/cart.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware'); // Đảm bảo import đúng

// Validation schemas
const addToCartSchema = validationSchemas.addToCart;
const updateCartItemSchema = validationSchemas.updateCartItem;
const removeFromCartSchema = validationSchemas.removeFromCart;

/**
 * Áp dụng middleware xác thực cho tất cả các route
 * @middleware auth
 */
// router.use(authMiddleware); // Nếu bạn muốn áp dụng cho tất cả, thì bỏ comment dòng này và bỏ từng cái ở dưới

/**
 * @route   GET /api/cart
 * @desc    Lấy thông tin giỏ hàng của người dùng hiện tại
 * @access  Private
 */
router.get('/', authMiddleware, cartController.getCart); // <-- THÊM authMiddleware VÀO ĐÂY

/**
 * @route   POST /api/cart
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @access  Private
 */
router.post('/', authMiddleware, validateMiddleware(addToCartSchema), cartController.addToCart);

/**
 * @route   PUT /api/cart
 * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
 * @access  Private
 */
router.put('/', authMiddleware, validateMiddleware(updateCartItemSchema), cartController.updateCartItem); // <-- NÊN THÊM authMiddleware VÀO ĐÂY NỮA

/**
 * @route   DELETE /api/cart
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @access  Private
 */
router.delete('/', authMiddleware, validateMiddleware(removeFromCartSchema), cartController.removeFromCart); // <-- NÊN THÊM authMiddleware VÀO ĐÂY NỮA

module.exports = router;