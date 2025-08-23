// OrderController.js

const Order = require("../models/Order");
const config = require("config");
const qs = require("qs");
const crypto = require("crypto");

// Hàm sort object theo key tăng dần
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).map(k => encodeURIComponent(k)).sort();

  keys.forEach(key => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  });

  return sorted;
}

// Hàm format date theo chuẩn VNPay (yyyymmddHHMMss)
function formatDateVNPay(date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

class OrderController {
  /**
   * @route   POST /api/orders
   * @desc    Create a new order
   * @access  Private
   */
  static async createOrder(req, res) {
    try {
      const { items, discount_amount, final_price, shipping_address, payment_method, note } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid product list." });
      }
      if (!final_price || typeof final_price !== "number") {
        return res.status(400).json({ success: false, message: "Invalid payment amount." });
      }
      if (!shipping_address || typeof shipping_address !== "string") {
        return res.status(400).json({ success: false, message: "Invalid shipping address." });
      }
      if (!payment_method || typeof payment_method !== "string") {
        return res.status(400).json({ success: false, message: "Invalid payment method." });
      }

      const order = await Order.create({
        userId: req.user._id,
        items,
        discount_amount,
        final_price,
        shipping_address,
        payment_method,
        note,
      });

      if (payment_method === "vnpay") {
        const paymentUrl = await OrderController.createPaymentUrl(order, req);
        return res.status(201).json({
          success: true,
          message: "Order created successfully. Redirecting to payment...",
          data: order,
          paymentUrl,
        });
      }

      res.status(201).json({ success: true, message: "Order created successfully", data: order });
    } catch (error) {
      console.error("🔥 Error creating order:", error);
      res.status(500).json({ success: false, message: "An error occurred while creating the order." });
    }
  }

  /**
   * Generates a VNPay payment URL.
   */
  static async createPaymentUrl(order, req) {
  try {
    const vnp_TmnCode = config.get("vnp_TmnCode");
    const vnp_HashSecret = config.get("vnp_HashSecret");
    const vnp_Url = config.get("vnp_Url");
    const vnp_ReturnUrl = config.get("vnp_ReturnUrl");

    const date = new Date();
    const createDate = formatDateVNPay(date);
    const expireDate = formatDateVNPay(new Date(date.getTime() + 15 * 60 * 1000)); // +15 phút

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // 🚨 Log giá trị đầu vào từ client
    console.log("===== TẠO VNPay URL =====");
    console.log("👉 Order ID:", order._id);
    console.log("👉 Final price (từ client):", order.final_price);

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: order._id.toString(),
      vnp_OrderInfo: `Thanh toan don hang ${order._id}`,
      vnp_OrderType: "other",
      vnp_Amount: order.final_price * 100, // Nhân 100 theo chuẩn VNPay
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // 🚨 Log params trước khi ký
    console.log("👉 VNPay Params (trước khi ký):", vnp_Params);

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    console.log("👉 Sign Data (chuỗi ký):", signData);

    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

    // 🚨 Log URL cuối cùng
    console.log("👉 Secure Hash:", signed);
    console.log("👉 VNPay URL:", paymentUrl);
    console.log("==========================");

    return paymentUrl;
  } catch (err) {
    console.error("🔥 Lỗi khi tạo VNPay URL:", err);
    throw err;
  }
}

  /**
   * @route   GET /api/orders/vnpay_ipn
   * @desc    Handles Instant Payment Notification (IPN) from VNPay
   * @access  Public
   */
  static async vnpayIpn(req, res) {
    try {
      const vnp_HashSecret = config.get("vnp_HashSecret");
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      const signData = qs.stringify(vnp_Params, { encode: false });
      const signed = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

      if (secureHash !== signed) {
        return res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
      }

      const orderId = vnp_Params["vnp_TxnRef"];
      const rspCode = vnp_Params["vnp_ResponseCode"];
      const transactionStatus = vnp_Params["vnp_TransactionStatus"];
      const amount = parseInt(vnp_Params["vnp_Amount"]) / 100;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }

      if (order.final_price !== amount) {
        return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
      }

      if (order.payment_status === "paid") {
        return res.status(200).json({ RspCode: "02", Message: "Order already updated" });
      }

      if (rspCode === "00" && transactionStatus === "00") {
        order.payment_status = "paid";
        order.status = "processing";
        await order.save();

        return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
      } else {
        order.payment_status = "failed";
        await order.save();

        return res.status(200).json({ RspCode: "00", Message: "Payment Failed but Confirmed" });
      }
    } catch (error) {
      console.error("🔥 Error in VNPay IPN:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }

  /**
   * @route   GET /api/orders/vnpay_return
   * @desc    VNPay redirects the user back here
   * @access  Public
   */
  static async vnpayReturn(req, res) {
    try {
      const vnp_HashSecret = config.get("vnp_HashSecret");
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      const signData = qs.stringify(vnp_Params, { encode: false });
      const signed = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

      if (secureHash !== signed) {
        return res.render("payment-result", {
          success: false,
          message: "Giao dịch không hợp lệ (Sai checksum)",
        });
      }

      const rspCode = vnp_Params["vnp_ResponseCode"];
      const transactionStatus = vnp_Params["vnp_TransactionStatus"];
      const orderId = vnp_Params["vnp_TxnRef"];
      const amount = parseInt(vnp_Params["vnp_Amount"]) / 100;

      if (rspCode === "00" && transactionStatus === "00") {
        return res.render("payment-result", {
          success: true,
          message: `Thanh toán thành công. Đơn hàng #${orderId}, số tiền ${amount.toLocaleString()} VND.`,
        });
      } else {
        return res.render("payment-result", {
          success: false,
          message: `Thanh toán thất bại. Mã lỗi: ${rspCode}`,
        });
      }
    } catch (error) {
      console.error("🔥 Error in VNPay Return:", error);
      return res.render("payment-result", {
        success: false,
        message: "Có lỗi xảy ra, vui lòng thử lại.",
      });
    }
  }

  // --- Other order management methods ---
  static async getUserOrders(req, res) {
    try {
      const orders = await Order.find({ userId: req.user._id }).sort({ created_date: -1 });
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
      if (!order) return res.status(404).json({ success: false, message: "Order not found." });

      if (order.status !== "pending") {
        return res.status(400).json({ success: false, message: "Cannot cancel a confirmed or canceled order." });
      }

      order.status = "cancelled";
      await order.save();
      res.status(200).json({ success: true, message: "Order canceled successfully.", data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Hủy đơn hàng của người dùng
 * @access  Private (yêu cầu đăng nhập)
 */
static async cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // middleware auth đã gán

    // Tìm đơn hàng thuộc về user
    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc không thuộc quyền sở hữu",
      });
    }

    // Kiểm tra trạng thái
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy đơn hàng khi đang ở trạng thái 'pending'",
      });
    }

    // Cập nhật trạng thái
    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("❌ Lỗi khi hủy đơn hàng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server. Vui lòng thử lại sau.",
    });
  }
}

  static async updateStatus(req, res) {
    try {
      const { status, payment_status, shipping_status, shipping_date, delivered_date } = req.body;
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: "Order not found." });

      if (status) order.status = status;
      if (payment_status) order.payment_status = payment_status;
      if (shipping_status) order.shipping_status = shipping_status;
      if (shipping_date) order.shipping_date = shipping_date;
      if (delivered_date) order.delivered_date = delivered_date;

      await order.save();
      res.status(200).json({ success: true, message: "Status updated successfully.", data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

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
