const mongoose = require('mongoose');

/**
 * Mô tả schema cho item trong giỏ hàng
 * @typedef {Object} CartItem
 * @property {mongoose.Schema.Types.ObjectId} productId - ID của sản phẩm, khóa ngoại tới products
 * @property {Number} quantity - Số lượng sản phẩm
 */
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        description: 'ID của sản phẩm trong giỏ hàng, khóa ngoại tới products',
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        description: 'Số lượng sản phẩm trong giỏ hàng',
    },
});

/**
 * Mô tả schema cho collection Cart
 * @typedef {Object} Cart
 * @property {mongoose.Schema.Types.ObjectId} _id - ID của giỏ hàng
 * @property {mongoose.Schema.Types.ObjectId} userId - ID của người dùng, khóa ngoại tới users
 * @property {CartItem[]} items - Danh sách các item trong giỏ hàng
 * @property {Date} updatedAt - Thời gian cập nhật cuối
 */
const cartSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            auto: true,
            description: 'ID của giỏ hàng, khóa chính',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            description: 'ID của người dùng sở hữu giỏ hàng, khóa ngoại tới users',
        },
        items: {
            type: [cartItemSchema],
            default: [],
            description: 'Mảng các món trong giỏ hàng',
        },
        updatedAt: {
            type: Date,
            required: true,
            default: Date.now,
            description: 'Thời gian cập nhật cuối của giỏ hàng',
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
    }
);

module.exports = mongoose.model('Cart', cartSchema);
