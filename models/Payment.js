// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['momo', 'zalopay', 'vnpay'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  momoTransId: { type: String }, // ID giả lập từ Momo
  createTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
