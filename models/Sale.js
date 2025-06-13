const mongoose = require('mongoose');

// Schema cho bảng Sales - lưu trữ thông tin doanh thu (có thể là từ orders)
const saleSchema = new mongoose.Schema({
  // ID đơn hàng liên quan
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // ID sản phẩm được bán
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // ID khách hàng mua
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Số lượng sản phẩm bán được
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Giá bán của sản phẩm tại thời điểm bán
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tổng doanh thu cho item này (quantity * price)
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Ngày thực hiện giao dịch
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Trạng thái giao dịch
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

// Index để tối ưu hóa query theo thời gian và sản phẩm
saleSchema.index({ saleDate: -1 });
saleSchema.index({ productId: 1, saleDate: -1 });
saleSchema.index({ userId: 1, saleDate: -1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;