const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

// ================================
//          USER ROUTES
// ================================
// Sử dụng middleware xác thực cho tất cả các route bên dưới
router.use(authMiddleware);

// Tạo một đơn hàng mới bằng hình thức COD
router.post("/", orderController.createOrder);

// Tạo đơn hàng và lấy link thanh toán MoMo
router.post("/momo", orderController.createMomoOrder);

// Lấy lịch sử đơn hàng của người dùng
router.get("/", orderController.getUserOrders);

// Người dùng huỷ đơn hàng nếu chưa xác nhận
router.put(
  '/:id/cancel',
  orderController.cancelOrder
);

// ================================
//          ADMIN ROUTES
// ================================
// Sử dụng middleware xác thực và phân quyền admin
router.use("/admin", authMiddleware, adminMiddleware);

// Admin lấy tất cả đơn hàng (có thể lọc theo trạng thái)
router.get("/", orderController.getAllOrders);

// Admin cập nhật trạng thái đơn hàng
router.put("/:id/status", orderController.updateStatus);


// ================================
//       PUBLIC PAYMENT ROUTES
// ================================
// Đây là các route public, không cần xác thực người dùng.
// MoMo sẽ gọi các route này để thông báo kết quả.

// Route xử lý IPN (Instant Payment Notification) từ MoMo
router.post("/momo/ipn", orderController.handleMomoIPN);

// Route xử lý URL trả về sau khi người dùng thanh toán trên MoMo
router.get("/momo/return", orderController.handleMomoReturn);

module.exports = router;