const Order = require("../models/Order");

class OrderController {
  /**
   * @route   POST /api/orders
   * @desc    Tạo mới đơn hàng
   * @access  Private
   */
  static async createOrder(req, res) {
    try {
      const { items, discount_amount, final_price, shipping_address, payment_method, note } = req.body;

      const order = await Order.create({
        userId: req.user._id,
        items,
        discount_amount,
        final_price,
        shipping_address,
        payment_method,
        note,
      });

      res.status(201).json({ success: true, message: "Tạo đơn hàng thành công", data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
      const order = await Order.findOne({ _id: req.params._id, userId: req.user._id });
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
      const order = await Order.findById(req.params._id);
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
