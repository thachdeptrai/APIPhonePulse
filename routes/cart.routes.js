const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const cartController = require('../controllers/cart.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
// Validation schemas
const addToCartSchema = validationSchemas.addToCart;
const updateCartItemSchema = validationSchemas.updateCartItem;
const removeFromCartSchema = validationSchemas.removeFromCart;

/**
 * Áp dụng middleware xác thực cho tất cả các route
 * @middleware auth
 */
// router.use(authMiddleware);

/**
 * @route   GET /api/cart
 * @desc    Lấy thông tin giỏ hàng của người dùng hiện tại
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/cart
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @access  Private
 */
router.post('/', authMiddleware,validateMiddleware(addToCartSchema), cartController.addToCart);

/**
 * @route   PUT /api/cart
 * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
 * @access  Private
 */
router.put('/', validateMiddleware(updateCartItemSchema), cartController.updateCartItem);

/**
 * @route   DELETE /api/cart
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @access  Private
 */
router.delete('/', validateMiddleware(removeFromCartSchema), cartController.removeFromCart);

module.exports = router;