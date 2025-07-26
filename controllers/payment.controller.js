// controllers/payment.controller.js
const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.createMomoPayment = async (req, res) => {
  try {
    const { orderId, userId, amount } = req.body;

    // Giả lập mã giao dịch momo
    const fakeMomoTransId = 'MOMO_' + Date.now();

    const payment = new Payment({
      orderId,
      userId,
      amount,
      paymentMethod: 'momo',
      paymentStatus: 'success', // Giả lập thành công luôn
      momoTransId: fakeMomoTransId
    });

    await payment.save();

    return res.status(201).json({
      message: 'Thanh toán Momo thành công (giả lập)',
      payment
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi thanh toán Momo' });
  }
};
