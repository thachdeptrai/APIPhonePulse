const mongoose = require('mongoose');

/**
 * Mô tả schema cho collection Voucher
 * @typedef {Object} Voucher
 * @property {String} code - Mã giảm giá, phải duy nhất
 * @property {'percent'|'amount'} discount_type - Loại giảm giá: phần trăm hoặc cố định
 * @property {Number} discount_value - Giá trị giảm
 * @property {Number} min_order_value - Giá trị đơn tối thiểu để áp dụng
 * @property {Number} max_discount - Số tiền giảm tối đa
 * @property {Number} quantity - Số lượng mã còn lại
 * @property {Date} start_date - Ngày bắt đầu áp dụng
 * @property {Date} end_date - Ngày hết hạn
 * @property {Date} created_date - Ngày tạo mã
 */
const voucherSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            description: 'Mã giảm giá, phải duy nhất',
        },
        discount_type: {
            type: String,
            enum: ['percent', 'amount'],
            required: true,
            description: 'Loại giảm giá: phần trăm hoặc cố định',
        },
        discount_value: {
            type: Number,
            required: true,
            description: 'Giá trị giảm',
        },
        min_order_value: {
            type: Number,
            default: 0,
            description: 'Giá trị đơn tối thiểu để áp dụng',
        },
        max_discount: {
            type: Number,
            description: 'Số tiền giảm tối đa',
        },
        quantity: {
            type: Number,
            default: 1,
            description: 'Số lượng mã còn lại',
        },
        start_date: {
            type: Date,
            required: true,
            description: 'Ngày bắt đầu áp dụng',
        },
        end_date: {
            type: Date,
            required: true,
            description: 'Ngày hết hạn',
        },
        created_date: {
            type: Date,
            default: Date.now,
            description: 'Ngày tạo mã',
        },
        modified_date : {
            type: Date,
            default: Date.now,
            description: 'Ngày chỉnh sửa mã',
        },
    },
    {
        timestamps: false,
    }
);

module.exports = mongoose.model('Voucher', voucherSchema);