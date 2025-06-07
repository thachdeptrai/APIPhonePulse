const mongoose = require('mongoose');

/**
 * Mô tả schema cho item trong đơn hàng
 * @typedef {Object} OrderItem
 * @property {mongoose.Schema.Types.ObjectId} productId - ID của sản phẩm, khóa ngoại tới products
 * @property {mongoose.Schema.Types.ObjectId} variantId - ID của biến thể sản phẩm, khóa ngoại tới variants
 * @property {Number} quantity - Số lượng sản phẩm đã đặt
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
  quantity: {
    type: Number,
    required: true,
    description: 'Số lượng sản phẩm đã đặt',
  },
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
  },
  {
    timestamps: {
      createdAt: 'created_date',
      updatedAt: 'modified_date',
    },
  }
);

module.exports = mongoose.model('Order', orderSchema);
