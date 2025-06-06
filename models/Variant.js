const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Liên kết sản phẩm
  color: { type: String, required: true },   // Màu sắc dưới dạng chuỗi
  size: { type: String, required: true },    // Kích thước/dung lượng dưới dạng chuỗi
  quantity: { type: Number, required: true },// Số lượng tồn kho
  price: { type: Number, required: true },   // Giá
  created_date: { type: Date, default: Date.now },
  modified_date: { type: Date, default: Date.now }
}, {
  collection: 'Variant'
});

module.exports = mongoose.model('Variant', variantSchema);
