const Order = require("../models/Order");

class OrderController {
  /**
   * @route   POST /api/orders
   * @desc    Tạo mới đơn hàng
   * @access  Private
   */
  static async createOrder(req, res) {
  try {
    console.log("===== [CREATE ORDER] =====");
    console.log("User từ middleware:", req.user);
    console.log("Body nhận được từ client:", req.body);

    const {
      items,
      discount_amount,
      final_price,
      shipping_address,
      payment_method,
      note
    } = req.body;

    // Kiểm tra từng trường một
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("❌ Lỗi: items không hợp lệ");
      return res.status(400).json({ success: false, message: "Danh sách sản phẩm không hợp lệ." });
    }

    if (!final_price || typeof final_price !== "number") {
      console.error("❌ Lỗi: final_price không hợp lệ");
      return res.status(400).json({ success: false, message: "Giá trị thanh toán không hợp lệ." });
    }

    if (!shipping_address || typeof shipping_address !== "string") {
      console.error("❌ Lỗi: shipping_address thiếu hoặc sai kiểu");
      return res.status(400).json({ success: false, message: "Địa chỉ giao hàng không hợp lệ." });
    }

    if (!payment_method || typeof payment_method !== "string") {
      console.error("❌ Lỗi: payment_method thiếu hoặc sai kiểu");
      return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ." });
    }

    // Log chi tiết các trường
    console.log("✔ items:", items);
    console.log("✔ discount_amount:", discount_amount);
    console.log("✔ final_price:", final_price);
    console.log("✔ shipping_address:", shipping_address);
    console.log("✔ payment_method:", payment_method);
    console.log("✔ note:", note);

    // Tạo đơn hàng
    const order = await Order.create({
      userId: req.user._id,
      items,
      discount_amount,
      final_price,
      shipping_address,
      payment_method,
      note,
    });

    console.log("✅ Đơn hàng đã được tạo:", order._id);

    res.status(201).json({ success: true, message: "Tạo đơn hàng thành công", data: order });
  } catch (error) {
    console.error("🔥 Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ success: false, message: error.message || "Đã xảy ra lỗi khi tạo đơn hàng" });
  }
}


  /**
   * @route   GET /api/orders
   * @desc    Lấy lịch sử đơn hàng của người dùng hiện tại
   * @access  Private
   */
  static async getUserOrders(req, res) {
    try {
      const orders = await Order.find({ userId: req.user._id }).sort({ created_date: -1 });
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   PUT /api/orders/:id/cancel
   * @desc    Hủy đơn hàng của người dùng
   * @access  Private
   */
  static async cancelOrder(req, res) {
    try {
      const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
      if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

      if (order.status !== "pending")
        return res.status(400).json({ success: false, message: "Không thể hủy đơn đã xác nhận hoặc đã hủy" });

      order.status = "cancelled";
      await order.save();
      res.status(200).json({ success: true, message: "Hủy đơn hàng thành công", data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   PUT /api/admin/orders/:id/status
   * @desc    Admin cập nhật trạng thái đơn hàng
   * @access  Admin
   */
  static async updateStatus(req, res) {
    try {
      const { status, payment_status, shipping_status, shipping_date, delivered_date } = req.body;
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

      if (status) order.status = status;
      if (payment_status) order.payment_status = payment_status;
      if (shipping_status) order.shipping_status = shipping_status;
      if (shipping_date) order.shipping_date = shipping_date;
      if (delivered_date) order.delivered_date = delivered_date;

      await order.save();
      res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   GET /api/admin/orders
   * @desc    Lấy danh sách đơn hàng (có thể lọc theo trạng thái)
   * @access  Admin
   */
  static async getAllOrders(req, res) {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
      const orders = await Order.find(filter).sort({ created_date: -1 });
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OrderController;
