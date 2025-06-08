const Category = require('../models/Category'); 

//  Lấy tất cả danh mục
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find(); // Lấy toàn bộ danh mục từ MongoDB
    res.json(categories); // Trả kết quả dưới dạng JSON
  } catch (err) {
    res.status(500).json({ error: err.message }); // Nếu có lỗi, trả về lỗi server
  }
};

//  Lấy một danh mục theo ID
exports.getById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id); // Tìm danh mục theo ID
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' }); // Nếu không tìm thấy, trả lỗi 404
    }
    res.json(category); // Trả kết quả danh mục
  } catch (err) {
    res.status(500).json({ error: err.message }); // Lỗi server
  }
};

// Tạo mới danh mục
exports.add = async (req, res) => {
  try {
    const newCat = new Category(req.body); // Tạo object mới từ request body
    const saved = await newCat.save(); // Lưu vào MongoDB
    res.status(201).json(saved); // Trả về kết quả
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả lỗi nếu dữ liệu sai
  }
};

//  Cập nhật danh mục
exports.update = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,        // ID danh mục
      req.body,             // Dữ liệu cập nhật
      { new: true }         // Trả về bản ghi mới sau khi update
    );
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' }); // Không tìm thấy
    }
    res.json(updated); // Trả về danh mục đã cập nhật
  } catch (err) {
    res.status(400).json({ error: err.message }); // Lỗi dữ liệu
  }
};

//  Xoá danh mục
exports.delete = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id); // Tìm và xoá theo ID
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' }); // Không có
    }
    res.json({ message: 'Đã xoá danh mục' }); // Trả về thông báo thành công
  } catch (err) {
    res.status(500).json({ error: err.message }); // Lỗi server
  }
};
