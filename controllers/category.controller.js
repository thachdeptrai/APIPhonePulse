const Category = require('../models/Category');

// Lấy tất cả danh mục
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh mục theo ID
exports.getById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo danh mục mới
exports.add = async (req, res) => {
  try {
    const newCat = new Category(req.body);
    const saved = await newCat.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật danh mục
exports.update = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xoá danh mục
exports.delete = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json({ message: 'Đã xoá danh mục' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
