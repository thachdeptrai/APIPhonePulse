const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size_name: { type: String, required: true },          // Đúng như sơ đồ
  storage : { type: String, required: true }, // dung lượng (ví dụ: 64GB, 128GB)
  created_date: { type: Date, default: Date.now },
  modified_date: { type: Date, default: Date.now }
}, {
  collection: 'Size'
});

module.exports = mongoose.model('Size', sizeSchema);
