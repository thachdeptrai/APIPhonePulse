const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

// ================================
//        PUBLIC ROUTES (VNPay)
// ================================
// VNPay IPN (Server-to-Server)
router.get("/vnpay_ipn", orderController.vnpayIpn);

// VNPay Return (Redirect from user's browser)
router.get("/vnpay_return", orderController.vnpayReturn);

// ================================
//        USER ROUTES
// ================================
router.use(authMiddleware);

// Create a new order
router.post("/", orderController.createOrder);

// Get a user's order history
router.get("/", orderController.getUserOrders);

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


// ================================
//        ADMIN ROUTES
// ================================
router.use("/admin", authMiddleware, adminMiddleware);

// Admin get all orders (with optional status filter)
router.get("/", orderController.getAllOrders);

// Admin update order status
router.put("/:id/status", orderController.updateStatus);

module.exports = router;