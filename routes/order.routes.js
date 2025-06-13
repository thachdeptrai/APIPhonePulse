const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

/**
 * ================================
 *           USER ROUTES
 * ================================
 */

/**
 * @route   POST /api/orders
 * @desc    Tạo đơn hàng mới từ giỏ hàng hiện tại
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  // validateMiddleware(createOrderSchema),  
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Lấy danh sách đơn hàng của người dùng hiện tại
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  orderController.getUserOrders
);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Người dùng huỷ đơn hàng nếu chưa xác nhận
 * @access  Private
 */
router.put(
  '/:id/cancel',
  authMiddleware,
  orderController.cancelOrder
);

/**
 * ================================
 *           ADMIN ROUTES
 * ================================
 */

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Admin cập nhật trạng thái đơn hàng (status / payment / shipping)
 * @access  Admin
 */
router.put(
  '/admin/orders/:id/status',
  authMiddleware,
  adminMiddleware,
  orderController.updateStatus
);

/**
 * @route   GET /api/admin/orders
 * @desc    Admin lấy danh sách tất cả đơn hàng
 * @access  Admin
 */
router.get(
  '/admin/orders',
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

module.exports = router;
