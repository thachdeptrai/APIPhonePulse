const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  }, // Liên kết tới sản phẩm gốc

  color_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Color', 
    required: false 
  }, // Màu sắc (optional, có thể null nếu sản phẩm không có màu)

  size_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Size', 
    required: false 
  }, // Kích thước/dung lượng (optional)

  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  }, // Số lượng tồn kho

  sold_count: { 
    type: Number, 
    default: 0, 
    min: 0 
  }, // ✅ số lượng đã bán (dùng để thống kê)

  price: { 
    type: Number, 
    required: true, 
    min: 0 
  }, // Giá bán thực tế

  original_price: { 
    type: Number, 
    min: 0 
  }, // ✅ Giá gốc (trước khi giảm giá)

  discount_percent: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  }, // ✅ % giảm giá (nếu có)

  images: [{ 
    type: String 
  }], // ✅ Danh sách ảnh riêng cho biến thể (URL)

  created_date: { 
    type: Date, 
    default: Date.now 
  },
  
  modified_date: { 
    type: Date, 
    default: Date.now 
  }
}, {
  collection: 'Variant'
});

// Auto update modified_date khi update
variantSchema.pre('save', function(next) {
  this.modified_date = Date.now();
  next();
});

module.exports = mongoose.model('Variant', variantSchema);
