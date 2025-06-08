const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },                             // Tên danh mục
    icon: { type: String },                                             // Icon đại diện (nếu có)
    created_date: { type: Date, default: Date.now },
    modified_date: { type: Date, default: Date.now }
  }, {
    collection: 'Category'
  });
  
  module.exports = mongoose.model('Category', categorySchema);
  