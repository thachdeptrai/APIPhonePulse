const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Tham chiếu đến sản phẩm
  color_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },    // Tham chiếu đến màu sắc (nếu có bảng Color)
  size_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },      // Tham chiếu đến kích thước/dung lượng (nếu có bảng Size)
  ram_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ram', required: true },         // Tham chiếu đến ram
  quantity: { type: Number, required: true },                                           // Số lượng tồn kho
  price: { type: Number, required: true },                                              // Giá của biến thể
  created_date: { type: Date, default: Date.now },
  modified_date: { type: Date, default: Date.now }
}, {
  collection: 'Variant' // Tên bảng MongoDB
});

module.exports = mongoose.model('Variant', variantSchema);