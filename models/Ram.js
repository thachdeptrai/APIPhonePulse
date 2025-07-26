const mongoose = require('mongoose');

const ramSchema = new mongoose.Schema({
  ram_name: { type: String, required: true }, // Ví dụ: "4GB", "6GB", "8GB"
  created_date: { type: Date, default: Date.now },
  modified_date: { type: Date, default: Date.now }
}, {
  collection: 'Ram'
});

module.exports = mongoose.model('Ram', ramSchema);
