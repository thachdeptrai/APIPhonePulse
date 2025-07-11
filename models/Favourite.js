const mongoose = require('mongoose');
/**
 * Mô tả schema cho collection Favourite
 * @typedef {Object} Favourite
 * @property {mongoose.Schema.Types.ObjectId} _id - ID của mục yêu thích
 * @property {mongoose.Schema.Types.ObjectId} userId - ID của người dùng, khóa ngoại tới users
 * @property {mongoose.Schema.Types.ObjectId} productId - ID của sản phẩm, khóa ngoại tới products
 * @property {Date} addedAt - Thời điểm thêm sản phẩm vào danh sách yêu thích
 */
const favouriteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            description: 'ID của người dùng sở hữu mục yêu thích, khóa ngoại tới users',
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            description: 'ID của sản phẩm trong danh sách yêu thích, khóa ngoại tới products',
        },
        modified_date: {
            type: Date,
            required: true,
            default: Date.now,
            description: 'Thời điểm thêm sản phẩm vào danh sách yêu thích',
        },
    },
    {
        timestamps: false,
    }
);

module.exports = mongoose.model('Favourite', favouriteSchema);
