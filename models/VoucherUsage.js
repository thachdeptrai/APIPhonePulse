const mongoose = require('mongoose');

/**
 * Mô tả schema cho collection VoucherUsage
 * @typedef {Object} VoucherUsage
 * @property {mongoose.Schema.Types.ObjectId} voucherId - ID của voucher đã sử dụng, khóa ngoại tới Voucher
 * @property {mongoose.Schema.Types.ObjectId} userId - ID của người dùng đã sử dụng, khóa ngoại tới User
 * @property {mongoose.Schema.Types.ObjectId} orderId - ID của đơn hàng áp dụng, khóa ngoại tới Order
 * @property {Date} used_at - Thời điểm sử dụng mã
 */
const voucherUsageSchema = new mongoose.Schema(
    {
        voucherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Voucher',
            required: true,
            description: 'ID của voucher đã sử dụng, khóa ngoại tới Voucher',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            description: 'ID của người dùng đã sử dụng, khóa ngoại tới User',
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            description: 'ID của đơn hàng áp dụng, khóa ngoại tới Order',
        },
        used_at: {
            type: Date,
            default: Date.now,
            description: 'Thời điểm sử dụng mã',
        },
    },
    {
        timestamps: false,
    }
);

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema);