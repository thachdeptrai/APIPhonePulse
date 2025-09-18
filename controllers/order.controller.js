const Order = require("../models/Order");
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const Variant = require("../models/Variant");  // ✅ thêm dòng này

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

    const { items, discount_amount, final_price, shipping_address, payment_method, note } = req.body;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách sản phẩm không hợp lệ." });
    }
    if (!final_price || typeof final_price !== "number") {
      return res.status(400).json({ success: false, message: "Giá trị thanh toán không hợp lệ." });
    }
    if (!shipping_address || typeof shipping_address !== "string") {
      return res.status(400).json({ success: false, message: "Địa chỉ giao hàng không hợp lệ." });
    }
    if (!payment_method || typeof payment_method !== "string") {
      return res.status(400).json({ success: false, message: "Phương thức thanh toán không hợp lệ." });
    }

    // Chuẩn hóa items
    const orderItems = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name || "",
      imageUrl: item.imageUrl || "",
      price: item.price || 0,
      quantity: item.quantity || 1,
      variant: item.variant || "",
    }));

    // Tạo đơn hàng
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      discount_amount,
      final_price,
      shipping_address,
      payment_method,
      note,
      status: "pending",
      payment_status: "unpaid",
      created_date: new Date(),
    });

    // ✅ Sau khi tạo đơn hàng -> cập nhật tồn kho và số lượng đã bán
    for (const item of orderItems) {
      await Variant.findByIdAndUpdate(
        item.variantId,
        {
          $inc: {
            quantity: -item.quantity,    // giảm tồn kho
            sold_count: item.quantity    // tăng số lượng đã bán
          }
        },
        { new: true }
      );
    }

    console.log("✅ Đơn hàng đã được tạo:", order._id);
    res.status(201).json({ success: true, message: "Tạo đơn hàng thành công", data: order });
  } catch (error) {
    console.error("🔥 Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}




  /**
     * @route POST /api/orders/momo
     * @desc Tạo đơn hàng và link thanh toán MoMo (nhưng chưa lưu vào DB)
     * @access Private
     */
    // order.controller.js
static async createMomoOrder(req, res) {
    try {
      console.log("===== [CREATE MOMO ORDER] =====");
      console.log("[MOMO][REQ USER]", req.user && req.user._id);
      const { items, discount_amount, final_price, shipping_address, note } = req.body;
      console.log("[MOMO][REQ BODY]", { itemsLength: items && items.length, discount_amount, final_price, shipping_address, hasNote: Boolean(note) });

      if (!items || !Array.isArray(items) || items.length === 0 || !final_price || typeof final_price !== "number" || !shipping_address || typeof shipping_address !== "string") {
        return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ." });
      }

      const orderId = new Date().getTime().toString();
      const requestId = orderId;
      const orderInfo = `Thanh toán cho đơn hàng ${orderId}`;

      const extraDataObject = {
        userId: req.user._id,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name || "",
          imageUrl: item.imageUrl || "",
          price: item.price || 0,
          quantity: item.quantity || 1,
          variant: item.variant || "",
        })),
        discount_amount,
        final_price,
        shipping_address,
        note,
      };
      const encodedExtraData = Buffer.from(JSON.stringify(extraDataObject)).toString("base64");

      const { accessKey, secretKey, partnerCode, redirectUrl, ipnUrl, requestType, endpoint } = config.momo;
      const rawSignature = `accessKey=${accessKey}&amount=${final_price}&extraData=${encodedExtraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

      const requestBody = {
        partnerCode,
        partnerName: "PhonePulse",
        storeId: "YourStoreId",
        requestId,
        amount: final_price,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: "vi",
        requestType,
        autoCapture: true,
        extraData: encodedExtraData,
        signature,
      };

      console.log("[MOMO][REQUEST] endpoint:", endpoint);
      console.log("[MOMO][REQUEST BODY]", { ...requestBody, signature: '[hidden]' });
      const momoResponse = await axios.post(endpoint, requestBody);
      console.log("[MOMO][RESPONSE]", momoResponse && momoResponse.data);

      res.status(200).json({
        success: true,
        message: "Tạo link thanh toán MoMo thành công",
        data: {
          momoPayUrl: momoResponse.data.payUrl,
          qrCodeUrl: momoResponse.data.qrCodeUrl,
        },
      });
    } catch (error) {
      console.error("🔥 Lỗi khi tạo đơn hàng MoMo:", error && (error.response?.data || error.message));
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: "Lỗi từ MoMo: " + (error.response.data.message || "Không xác định"),
          error_details: error.response.data,
        });
      } else {
        return res.status(500).json({ success: false, message: error.message });
      }
    }

}
    /**
     * @route POST /api/orders/momo/ipn
     * @desc Xử lý IPN từ MoMo để tạo đơn hàng chính thức
     * @access Public (MoMo access)
     */
     /**
   * @route POST /api/orders/momo/ipn
   * @desc Xử lý IPN từ MoMo (thanh toán thành công mới cộng bán)
   */
  /**
 * @route POST /api/orders/momo/ipn
 * @desc Xử lý IPN từ MoMo (MoMo server gọi đến khi thanh toán thành công/thất bại)
 * @access Public
 */
static async handleMomoIPN(req, res) {
  try {
    console.log("===== [MOMO IPN CALLBACK] =====");
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;
    console.log("[MOMO][IPN][BODY]", { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraDataLen: extraData && extraData.length });
    const { accessKey, secretKey } = config.momo;

    // Kiểm tra chữ ký
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
    if (expectedSignature !== signature) {
      console.warn("[MOMO][IPN] Invalid signature", { expectedSignature, signature });
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Chỉ xử lý khi thanh toán thành công
    if (Number(resultCode) === 0 || Number(resultCode) === 9000) {
      console.log("[MOMO][IPN] resultCode success branch");
      // Kiểm tra đơn hàng đã tồn tại chưa
      let order = await Order.findOne({ "meta.momoTransactionId": orderId });
      console.log("[MOMO][IPN] existing order?", Boolean(order));
      if (!order) {
        // Giải mã extraData
        const decodedExtraData = JSON.parse(Buffer.from(extraData, "base64").toString("utf-8"));
        console.log("[MOMO][IPN] decodedExtraData", { userId: decodedExtraData && decodedExtraData.userId, itemsLen: decodedExtraData && decodedExtraData.items && decodedExtraData.items.length, final_price: decodedExtraData && decodedExtraData.final_price });
        // Tạo đơn hàng mới
        order = await Order.create({
          userId: decodedExtraData.userId,
          items: decodedExtraData.items,
          discount_amount: decodedExtraData.discount_amount,
          final_price: decodedExtraData.final_price,
          shipping_address: decodedExtraData.shipping_address,
          payment_method: "MoMo",
          note: decodedExtraData.note,
          status: "confirmed",
          payment_status: "paid",
          created_date: new Date(),
          meta: {
            momoTransactionId: orderId,
            momoResponse: req.body,
          },
        });
        console.log("[MOMO][IPN] created order", order && order._id);
      }
      // Tăng số bán nếu đủ điều kiện
      await Order.applySalesIfEligible(order._id);

      console.log(`✅ Đã tạo/cập nhật đơn hàng MoMo thành công: ${order._id}`);
      return res.status(200).json({ success: true, message: "Thanh toán thành công, đơn hàng đã được xác nhận.", data: order });
    } else {
      // Thanh toán thất bại
      console.log(`❌ Thanh toán thất bại cho giao dịch ${orderId}. Mã lỗi: ${resultCode}`);
      return res.status(200).json({ success: false, message: `Thanh toán thất bại. Mã lỗi: ${resultCode}`, orderId });
    }
  } catch (error) {
    console.error("🔥 Lỗi khi xử lý IPN:", error && (error.response?.data || error.stack || error.message));
    res.status(500).json({ success: false, message: error.message });
  }
}

static async handleMomoReturn(req, res) {
  console.log("===== [MOMO RETURN URL] =====");
  const { resultCode, orderId, message, extraData } = req.query;
  console.log(`Nhận phản hồi từ MoMo: orderId=${orderId}, resultCode=${resultCode}, message=${message}`);

  try {
    if (Number(resultCode) === 0 || Number(resultCode) === 9000) {
      // Kiểm tra order đã tồn tại chưa
      let order = await Order.findOne({ "meta.momoTransactionId": orderId });
      console.log("[MOMO][RETURN] existing order?", Boolean(order));
      if (!order) {
        // Giải mã extraData
        let decodedExtraData = null;
        try {
          decodedExtraData = JSON.parse(Buffer.from(extraData, "base64").toString("utf-8"));
          console.log("[MOMO][RETURN] decodedExtraData", { userId: decodedExtraData && decodedExtraData.userId, itemsLen: decodedExtraData && decodedExtraData.items && decodedExtraData.items.length, final_price: decodedExtraData && decodedExtraData.final_price });
        } catch (err) {
          console.error("❌ Lỗi khi decode extraData:", err);
        }
        if (!decodedExtraData) {
          return res.status(400).json({
            success: false,
            message: "Không thể giải mã dữ liệu extraData để tạo đơn hàng.",
          });
        }
        // Tạo đơn hàng mới
        order = await Order.create({
          userId: decodedExtraData.userId,
          items: decodedExtraData.items,
          discount_amount: decodedExtraData.discount_amount,
          final_price: decodedExtraData.final_price,
          shipping_address: decodedExtraData.shipping_address,
          payment_method: "MoMo",
          note: decodedExtraData.note,
          status: "pending",
          payment_status: "paid",
          created_date: new Date(),
          meta: {
            momoTransactionId: orderId,
            momoResponse: req.query,
          },
        });
        console.log("[MOMO][RETURN] created order", order && order._id);
      }
      // Tăng số bán nếu đủ điều kiện
      await Order.applySalesIfEligible(order._id);

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công. Đơn hàng của bạn đã được xác nhận.",
        data: order,
      });
    } else {
      // Thanh toán thất bại
      console.log(`❌ Thanh toán thất bại cho giao dịch ${orderId}. Mã lỗi: ${resultCode}`);
      return res.status(200).json({
        success: false,
        message: `Thanh toán thất bại. Mã lỗi: ${resultCode}`,
        orderId,
      });
    }
  } catch (error) {
    console.error("🔥 Lỗi khi xử lý Return:", error && (error.response?.data || error.stack || error.message));
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý kết quả thanh toán.",
      orderId,
    });
  }


  
}
  /**
   * @route   GET /api/orders
   * @desc    Lấy lịch sử đơn hàng của người dùng hiện tại
   * @access  Private
   */
  static async getUserOrders(req, res) {
    try {
      console.log("===== [GET USER ORDERS] =====");

      const orders = await Order.find({ userId: req.user._id })
        .sort({ created_date: -1 })
        .lean();


      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("🔥 Lỗi khi lấy lịch sử đơn hàng:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Hủy đơn hàng của người dùng
 * @access  Private
 */
/** ================================
 *  [HỦY ĐƠN HÀNG - Cả Online & COD]
 *  ================================ */
// USER CANCEL ORDER
static async cancelOrder(req, res) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Đơn hàng đã bị hủy trước đó" });
    }

    let needRollback = false;

    if (order.payment_method === "COD" && order.status === "delivered") {
      // COD mà đã giao rồi thì rollback
      needRollback = true;
    }
    if (order.payment_method !== "COD" && order.payment_status === "paid") {
      // Online đã thanh toán thì rollback
      needRollback = true;
    }

    if (needRollback) {
      for (const item of order.items) {
        await Variant.findByIdAndUpdate(item.variantId, {
          $inc: { sold_count: -item.quantity, quantity: item.quantity },
        });
      }
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({ success: true, message: "Hủy đơn hàng thành công", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


// ADMIN UPDATE STATUS
static async updateStatus(req, res) {
  try {
    const { status, payment_status, shipping_status, shipping_date, delivered_date } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    // Lưu lại trạng thái cũ để so sánh
    const prevStatus = order.status;
    const prevPaymentStatus = order.payment_status;
    const prevShippingStatus = order.shipping_status; // Quan trọng để theo dõi sự thay đổi

    // Cập nhật các trường
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;
    if (shipping_status) order.shipping_status = shipping_status;
    if (shipping_date) order.shipping_date = shipping_date;
    if (delivered_date) order.delivered_date = delivered_date;

    // Logic cộng số bán và trừ tồn kho
    // Áp dụng cho đơn hàng COD
    if (order.payment_method === "COD") {
      // Chỉ cộng số bán khi đơn hàng được chuyển sang trạng thái "shipped" (đã giao thành công)
      if (shipping_status === "shipped" && prevShippingStatus !== "shipped") {
        for (const item of order.items) {
          await Variant.findByIdAndUpdate(item.variantId, {
            $inc: { sold_count: item.quantity, quantity: -item.quantity },
          });
        }
      }
    }
    // Áp dụng cho đơn hàng Thanh toán trực tuyến (MoMo)
    else {
      // Chỉ cộng số bán khi thanh toán được chuyển sang trạng thái "paid"
      if (payment_status === "paid" && prevPaymentStatus !== "paid") {
        for (const item of order.items) {
          await Variant.findByIdAndUpdate(item.variantId, {
            $inc: { sold_count: item.quantity, quantity: -item.quantity },
          });
        }
      }
    }

    // Lưu thay đổi vào database
    await order.save();

    return res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", data: order });
  } catch (error) {
    console.error("🔥 Lỗi khi cập nhật trạng thái đơn hàng:", error);
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
      console.log("===== [ADMIN GET ALL ORDERS] =====");
      const { status } = req.query;
      const filter = status ? { status } : {};
      const orders = await Order.find(filter).sort({ created_date: -1 });
      console.log(`✅ Lấy được ${orders.length} đơn hàng`);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error("🔥 Lỗi khi admin lấy danh sách đơn hàng:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = OrderController;