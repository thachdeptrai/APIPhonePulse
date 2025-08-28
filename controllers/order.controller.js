const Order = require("../models/Order");
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

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

      // Chuẩn hóa items: luôn lưu đầy đủ name, imageUrl, price, variant
      const orderItems = items.map((item, index) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name || "",
        imageUrl: item.imageUrl || "",
        price: item.price || 0,
        quantity: item.quantity || 1,
        variant: item.variant || ""
      }));

      console.log("✔ orderItems sau khi chuẩn hóa:", orderItems);

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
        created_date: new Date()
      });

      console.log("✅ Đơn hàng đã được tạo:", order._id);
      console.log("Order chi tiết:", order);

      res.status(201).json({ success: true, message: "Tạo đơn hàng thành công", data: order });
    } catch (error) {
      console.error("🔥 Lỗi khi tạo đơn hàng:", error);
      res.status(500).json({ success: false, message: error.message || "Đã xảy ra lỗi khi tạo đơn hàng" });
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
            const { items, discount_amount, final_price, shipping_address, note } = req.body;

            // Validation
            if (!items || !Array.isArray(items) || items.length === 0 || !final_price || typeof final_price !== "number" || !shipping_address || typeof shipping_address !== "string") {
                return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ." });
            }

            const orderId = new Date().getTime().toString();
            const requestId = orderId;
            const orderInfo = `Thanh toán cho đơn hàng ${orderId}`;
            
            // Tạo object chứa dữ liệu extraData
            const extraDataObject = {
                userId: req.user._id,
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name || "",
                    imageUrl: item.imageUrl || "",
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    variant: item.variant || ""
                })),
                discount_amount,
                final_price,
                shipping_address,
                note
            };
            const extraDataString = JSON.stringify(extraDataObject);
            const encodedExtraData = Buffer.from(extraDataString).toString('base64');

            // Lấy cấu hình từ file .env
            const { accessKey, secretKey, partnerCode, redirectUrl, ipnUrl, requestType, endpoint } = config.momo;

            // Chuỗi để ký (rawSignature) - Đảm bảo thứ tự tham số khớp với MoMo
            const rawSignature = `accessKey=${accessKey}&amount=${final_price}&extraData=${encodedExtraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            
            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = {
                partnerCode,
                partnerName: 'Your Store Name',
                storeId: 'YourStoreId',
                requestId,
                amount: final_price,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: false,
                extraData: encodedExtraData,
                signature,
            };

            const momoResponse = await axios.post(endpoint, requestBody);

            console.log("✅ Lấy link thanh toán MoMo thành công:", momoResponse.data.payUrl);
             console.log("🖼️ qrCodeUrl:", momoResponse.data.qrCodeUrl);
            res.status(200).json({
                success: true,
                message: "Tạo link thanh toán MoMo thành công",
                data: {
                    momoPayUrl: momoResponse.data.payUrl,
                    qrCodeUrl: momoResponse.data.qrCodeUrl,
                },
            });

        } catch (error) {
            console.error("🔥 Lỗi khi tạo đơn hàng MoMo:", error);
            if (error.response) {
                console.error("Momo Response Data:", error.response.data);
                return res.status(error.response.status).json({
                    success: false,
                    message: "Lỗi từ MoMo: " + (error.response.data.message || "Không xác định"),
                    error_details: error.response.data
                });
            } else {
                return res.status(500).json({ success: false, message: error.message || "Đã xảy ra lỗi khi tạo đơn hàng MoMo" });
            }
        }
    
}
    /**
     * @route POST /api/orders/momo/ipn
     * @desc Xử lý IPN từ MoMo để tạo đơn hàng chính thức
     * @access Public (MoMo access)
     */
   static async handleMomoIPN(req, res) {
  try {
    console.log("===== [MOMO IPN CALLBACK] =====");
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    console.log("Dữ liệu nhận được:", req.body);

    const { accessKey, secretKey } = config.momo;

    // 🔑 Build rawSignature đúng chuẩn
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

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("❌ Lỗi: Chữ ký không hợp lệ");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Chữ ký hợp lệ
    if (Number(resultCode) === 0 || Number(resultCode) === 9000) {
      // tránh tạo đơn trùng
      const existingOrder = await Order.findOne({ "meta.momoTransactionId": orderId });
      if (existingOrder) {
        console.log(`⚠️ Đơn hàng ${orderId} đã tồn tại. Bỏ qua.`);
        return res.status(204).send();
      }

      // decode extraData
      const decodedExtraData = Buffer.from(extraData, "base64").toString("utf-8");
      const orderData = JSON.parse(decodedExtraData);

      const order = await Order.create({
        userId: orderData.userId,
        items: orderData.items,
        discount_amount: orderData.discount_amount,
        final_price: orderData.final_price,
        shipping_address: orderData.shipping_address,
        payment_method: "MoMo",
        note: orderData.note,
        status: "confirmed",
        payment_status: "paid",
        created_date: new Date(),
        meta: {
          momoTransactionId: orderId,
          momoResponse: req.body,
        },
      });

      console.log(`✅ Đơn hàng ${order._id} đã được tạo thành công.`);
    } else {
      console.log(`⚠️ Thanh toán thất bại. orderId=${orderId}, resultCode=${resultCode}`);
    }

    return res.status(204).send();
  } catch (error) {
    console.error("🔥 Lỗi khi xử lý IPN:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
}

  /**
   * @route GET /api/orders/momo/return
   * @desc Xử lý sau khi người dùng thanh toán trên MoMo
   * @access Public
   */
   
    static async handleMomoReturn(req, res) {
  console.log("===== [MOMO RETURN URL] =====");

  const { resultCode, orderId, message, extraData } = req.query;
  console.log(`Nhận phản hồi từ MoMo: orderId=${orderId}, resultCode=${resultCode}, message=${message}`);

  try {
    if (resultCode == 0) {
      // Tìm đơn hàng theo transactionId
      let order = await Order.findOne({ 'meta.momoTransactionId': orderId });

      if (!order) {
        // 🔑 Nếu IPN chưa xử lý, thì mình tạo luôn ở đây
        console.warn(`⚠️ Đơn hàng ${orderId} chưa có trong DB, tiến hành tạo mới từ Return URL.`);

        // Giải mã extraData
        let decodedExtraData = null;
        try {
          decodedExtraData = Buffer.from(extraData, "base64").toString("utf-8");
          decodedExtraData = JSON.parse(decodedExtraData);
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
          status: "confirmed",
          payment_status: "paid",
          created_date: new Date(),
          meta: {
            momoTransactionId: orderId,
            momoResponse: req.query, // log luôn query từ MoMo
          },
        });

        console.log(`✅ Đã tạo đơn hàng mới từ Return URL: ${order._id}`);
      } else {
        console.log(`✅ Đã tìm thấy đơn hàng trong DB: ${order._id}`);
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công. Đơn hàng của bạn đã được xác nhận.",
        data: order,
      });
    } else {
      // Trường hợp thanh toán thất bại
      console.log(`❌ Thanh toán thất bại cho giao dịch ${orderId}. Mã lỗi: ${resultCode}`);
      return res.status(200).json({
        success: false,
        message: `Thanh toán thất bại. Mã lỗi: ${resultCode}`,
        orderId,
      });
    }
  } catch (error) {
    console.error("🔥 Lỗi khi xử lý Return:", error);
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
      console.log("User từ middleware:", req.user);

      const orders = await Order.find({ userId: req.user._id })
        .sort({ created_date: -1 })
        .lean();

      console.log(`✅ Lấy được ${orders.length} đơn hàng cho user ${req.user._id}`);
      orders.forEach((o, i) => console.log(`📌 Đơn hàng [${i}] - ID: ${o._id}, items:`, o.items));

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
static async cancelOrder(req, res) {
  try {
    console.log("===== [CANCEL ORDER] =====");
    console.log("User từ middleware:", req.user);
    console.log("OrderId:", req.params.id);

    // Tìm và update luôn trong 1 lần query
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: "pending" }, // chỉ cho phép hủy nếu là pending
      { $set: { status: "cancelled" } },
      { new: true } // trả về document sau khi update
    );

    if (!order) {
      console.warn("❌ Không thể hủy đơn (không tồn tại hoặc không ở trạng thái pending)");
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn đã xác nhận, đã hủy hoặc không tồn tại",
      });
    }

    console.log("✅ Hủy đơn hàng thành công:", order._id);
    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("🔥 Lỗi khi hủy đơn:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
}


  /**
   * @route   PUT /api/admin/orders/:id/status
   * @desc    Admin cập nhật trạng thái đơn hàng
   * @access  Admin
   */
  static async updateStatus(req, res) {
    try {
      console.log("===== [ADMIN UPDATE STATUS] =====");
      console.log("OrderId:", req.params.id, "Body:", req.body);

      const { status, payment_status, shipping_status, shipping_date, delivered_date } = req.body;
      const order = await Order.findById(req.params.id);
      if (!order) {
        console.error("❌ Không tìm thấy đơn hàng");
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
      }

      if (status) order.status = status;
      if (payment_status) order.payment_status = payment_status;
      if (shipping_status) order.shipping_status = shipping_status;
      if (shipping_date) order.shipping_date = shipping_date;
      if (delivered_date) order.delivered_date = delivered_date;

      await order.save();

      console.log("✅ Cập nhật trạng thái thành công:", order._id);
      res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", data: order });
    } catch (error) {
      console.error("🔥 Lỗi khi admin cập nhật trạng thái:", error);
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