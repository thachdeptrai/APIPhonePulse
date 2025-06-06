const mongoose = require('mongoose');

/**
 * Mô tả schema cho collection Review
 * @typedef {Object} Review
 * @property {mongoose.Schema.Types.ObjectId} _id - ID của đánh giá
 * @property {mongoose.Schema.Types.ObjectId} userId - ID của người dùng, khóa ngoại tới users
 * @property {mongoose.Schema.Types.ObjectId} productId - ID của sản phẩm, khóa ngoại tới products
 * @property {String} content - Nội dung đánh giá
 * @property {String} images - URL hình ảnh liên quan đến đánh giá
 * @property {Number} number_of_stars - Số sao đánh giá
 * @property {Date} created_date - Thời điểm tạo đánh giá
 * @property {Date} modified_date - Thời điểm chỉnh sửa đánh giá
 */
const reviewSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            auto: true,
            description: 'ID của đánh giá, khóa chính',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            description: 'ID của người dùng tạo đánh giá, khóa ngoại tới users',
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            description: 'ID của sản phẩm được đánh giá, khóa ngoại tới products',
        },
        content: {
            type: String,
            required: true,
            description: 'Nội dung đánh giá',
        },
        images: {
            type: String,
            description: 'URL hình ảnh liên quan đến đánh giá',
        },
        number_of_stars: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            description: 'Số sao đánh giá (từ 1 đến 5)',
        },
        created_date: {
            type: Date,
            required: true,
            default: Date.now,
            description: 'Thời điểm tạo đánh giá',
        },
        modified_date: {
            type: Date,
            required: true,
            default: Date.now,
            description: 'Thời điểm chỉnh sửa đánh giá',
        },
    },
    {
        timestamps: false,
    }
);

module.exports = mongoose.model('Review', reviewSchema);