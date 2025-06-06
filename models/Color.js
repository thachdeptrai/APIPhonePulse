const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  color_name: { type: String, required: true },         // Đúng như sơ đồ
  created_date: { type: Date, default: Date.now },
  modified_date: { type: Date, default: Date.now }
}, {
  collection: 'Color'
});

module.exports = mongoose.model('Color', colorSchema);
