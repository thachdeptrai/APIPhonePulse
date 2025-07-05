const mongoose = require('mongoose'); 
const productSchema = new mongoose.Schema({
    product_name: { type: String, required: true },                             // Tên sản phẩm
    description: { type: String },                                      // Mô tả sản phẩm
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Tham chiếu đến danh mục
    created_date: { type: Date, default: Date.now },
    modified_date: { type: Date, default: Date.now }
  }, {
    collection: 'Product'
  });
  
  module.exports = mongoose.model('Product', productSchema);