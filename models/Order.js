const mongoose = require('mongoose');
const Variant = require('./Variant');

/**
 * Mô tả schema cho item trong đơn hàng
 * @typedef {Object} OrderItem
 * @property {mongoose.Schema.Types.ObjectId} productId - ID của sản phẩm, khóa ngoại tới products
 * @property {mongoose.Schema.Types.ObjectId} variantId - ID của biến thể sản phẩm, khóa ngoại tới variants
 * @property {String} name - Tên của sản phẩm (để lưu trữ snapshot tại thời điểm đặt hàng)
 * @property {String} imageUrl - URL hình ảnh của sản phẩm
 * @property {Number} price - Giá của sản phẩm tại thời điểm đặt hàng
 * @property {Number} quantity - Số lượng sản phẩm đã đặt
 * @property {String} variant - Tên biến thể (ví dụ: "Màu Đen")
 */
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        description: 'ID của sản phẩm, khóa ngoại tới products',
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant',
        required: true,
        description: 'ID của biến thể sản phẩm, khóa ngoại tới variants',
    },
    name: { type: String, description: 'Tên của sản phẩm' },
    imageUrl: { type: String, description: 'URL hình ảnh của sản phẩm' },
    price: { type: Number, description: 'Giá của sản phẩm tại thời điểm đặt hàng' },
    quantity: {
        type: Number,
        required: true,
        description: 'Số lượng sản phẩm đã đặt',
    },
    variant: { type: String, description: 'Tên biến thể' },
});

/**
 * Mô tả schema cho collection Order
 * @typedef {Object} Order
 * @property {mongoose.Schema.Types.ObjectId} userId - ID của người dùng, khóa ngoại tới users
 * @property {OrderItem[]} items - Danh sách sản phẩm trong đơn hàng
 * @property {Number} discount_amount - Số tiền giảm giá (từ voucher)
 * @property {Number} final_price - Tổng tiền thanh toán sau khi áp dụng giảm giá
 * @property {'pending'|'confirmed'|'cancelled'} status - Trạng thái đơn hàng
 * @property {String} shipping_address - Địa chỉ giao hàng
 * @property {String} payment_method - Phương thức thanh toán
 * @property {'unpaid'|'paid'|'refunded'} payment_status - Trạng thái thanh toán
 * @property {'not_shipped'|'shipping'|'shipped'} shipping_status - Trạng thái vận chuyển
 * @property {String} note - Ghi chú thêm của khách hàng
 * @property {Date} shipping_date - Ngày giao hàng
 * @property {Date} delivered_date - Ngày giao hàng thành công
 * @property {Object} meta - Dữ liệu bổ sung liên quan đến giao dịch thanh toán
 * @property {String} meta.momoTransactionId - ID giao dịch MoMo để tránh tạo đơn hàng trùng lặp
 * @property {Date} created_date - Ngày tạo đơn hàng
 * @property {Date} modified_date - Ngày cập nhật đơn hàng gần nhất
 */
const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            description: 'ID của người dùng, khóa ngoại tới users',
        },
        items: {
            type: [orderItemSchema],
            required: true,
            description: 'Danh sách sản phẩm trong đơn hàng',
        },
        discount_amount: {
            type: Number,
            default: 0,
            description: 'Số tiền giảm giá từ voucher',
        },
        final_price: {
            type: Number,
            required: true,
            description: 'Tổng tiền thanh toán sau khi áp dụng giảm giá',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
            description: 'Trạng thái đơn hàng',
        },
        shipping_address: {
            type: String,
            required: true,
            description: 'Địa chỉ giao hàng của khách hàng',
        },
        payment_method: {
            type: String,
            required: true,
            description: 'Phương thức thanh toán được chọn',
        },
        payment_status: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
            description: 'Trạng thái thanh toán',
        },
        shipping_status: {
            type: String,
            enum: ['not_shipped', 'shipping', 'shipped'],
            default: 'not_shipped',
            description: 'Trạng thái vận chuyển của đơn hàng',
        },
        note: {
            type: String,
            description: 'Ghi chú của khách hàng cho đơn hàng (nếu có)',
        },
        shipping_date: {
            type: Date,
            description: 'Ngày giao hàng dự kiến hoặc thực tế',
        },
        delivered_date: {
            type: Date,
            description: 'Ngày đơn hàng được giao thành công',
        },
        meta: {
            momoTransactionId: {
                type: String,
                // index: true,
                unique: true,
                sparse: true, // Cho phép giá trị null không cần duy nhất
                description: 'ID giao dịch MoMo để tránh tạo đơn hàng trùng lặp',
            },
            momoResponse: {
                type: Object,
                description: 'Lưu trữ toàn bộ phản hồi từ MoMo IPN',
            }
        },
        // Cờ đảm bảo chỉ cộng số lượng bán một lần khi đủ điều kiện
        sales_applied: {
            type: Boolean,
            default: false,
            description: 'Đã áp dụng cộng số bán và trừ tồn kho hay chưa'
        }
    },
    {
        timestamps: {
            createdAt: 'created_date',
            updatedAt: 'modified_date',
        },
    }
);

// Áp dụng cộng số bán và trừ tồn kho một lần khi đủ điều kiện
orderSchema.statics.applySalesIfEligible = async function applySalesIfEligible(orderId) {
    const OrderModel = this;
    const order = await OrderModel.findById(orderId);
    if (!order) return null;
    if (order.sales_applied) return order;

    // Chỉ áp dụng khi đơn đã xác nhận và đã thanh toán
    if (order.status !== 'confirmed' || order.payment_status !== 'paid') {
        return order;
    }

    for (const item of order.items) {
        await Variant.findByIdAndUpdate(
            item.variantId,
            { $inc: { sold_count: item.quantity, quantity: -item.quantity } },
            { new: true }
        );
    }

    order.sales_applied = true;
    await order.save();
    return order;
};

module.exports = mongoose.model('Order', orderSchema);