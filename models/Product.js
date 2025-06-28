const mongoose = require('mongoose'); 
const productSchema = new mongoose.Schema({
    product_name: { type: String, required: true },                             // Tên sản phẩm
    description: { type: String },                                      // Mô tả sản phẩm
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Tham chiếu đến danh mục
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }, // các biến thể sản phẩm
    productimage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductImage' }, // Tham chiếu đến ảnh sản phẩm
    created_date: { type: Date, default: Date.now },
    modified_date: { type: Date, default: Date.now }
  }, {
    collection: 'Product'
  });
  
  module.exports = mongoose.model('Product', productSchema);