const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

// ================================
//       PUBLIC PAYMENT ROUTES
// ================================
// Đặt các route public lên trên cùng để không bị ảnh hưởng bởi middleware xác thực.
// MoMo sẽ gọi các route này để thông báo kết quả.

// Route xử lý IPN (Instant Payment Notification) từ MoMo
router.post("/momo/ipn", orderController.handleMomoIPN);

// Route xử lý URL trả về sau khi người dùng thanh toán trên MoMo
router.get("/momo/return", orderController.handleMomoReturn);

// ================================
//        USER ROUTES
// ================================
// Áp dụng middleware xác thực cho tất cả các route bên dưới
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
//        ADMIN ROUTES
// ================================
// Áp dụng middleware xác thực và phân quyền admin
router.use("/admin", authMiddleware, adminMiddleware);

// Admin lấy tất cả đơn hàng (có thể lọc theo trạng thái)
router.get("/admin/orders", orderController.getAllOrders);

// Admin cập nhật trạng thái đơn hàng
router.put("/admin/:id/status", orderController.updateStatus);

module.exports = router;