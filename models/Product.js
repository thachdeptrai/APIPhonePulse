const mongoose = require('mongoose'); 
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },                             // Tên sản phẩm
    description: { type: String },                                      // Mô tả sản phẩm
    id_cat: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Tham chiếu đến danh mục
    image: { type: String },                                            // Đường dẫn ảnh
    created_date: { type: Date, default: Date.now },
    modified_date: { type: Date, default: Date.now }
  }, {
    collection: 'Product'
  });
  
  module.exports = mongoose.model('Product', productSchema);