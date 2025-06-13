const Size = require('../models/Size'); 

// 📥 Lấy tất cả kích thước
exports.getAll = async (req, res) => {
  try {
    const sizes = await Size.find(); // Tìm tất cả các bản ghi trong bảng Size
    res.json(sizes); // Trả về danh sách kích thước
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách kích thước.' }); // Báo lỗi server
  }
};

// 🔍 Lấy một kích thước theo ID
exports.getById = async (req, res) => {
  try {
    const size = await Size.findById(req.params._id); // Tìm kích thước theo ID
    if (!size) {
      return res.status(404).json({ message: 'Không tìm thấy kích thước.' }); // Không có kích thước
    }
    res.json(size); // Trả về kích thước
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy kích thước.' }); // Lỗi server
  }
};

// ➕ Tạo mới kích thước
exports.create = async (req, res) => {
  try {
    const size = new Size(req.body); // Tạo mới đối tượng Size từ body gửi lên
    const saved = await size.save(); // Lưu vào MongoDB
    res.status(201).json(saved); // Trả về kích thước vừa tạo
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm kích thước.' }); // Báo lỗi nếu dữ liệu không hợp lệ
  }
};

// ✏️ Cập nhật kích thước
exports.update = async (req, res) => {
  try {
    // Cập nhật bản ghi theo ID với dữ liệu mới từ req.body, trả về bản ghi sau khi cập nhật
    const updated = await Size.findByIdAndUpdate(req.params._id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy kích thước để cập nhật.' });
    }
    res.json(updated); // Trả về kích thước sau khi cập nhật
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật kích thước.' }); // Báo lỗi
  }
};

// ❌ Xoá kích thước
exports.delete = async (req, res) => {
  try {
    const deleted = await Size.findByIdAndDelete(req.params._id); // Xoá bản ghi theo ID
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy kích thước để xoá.' });
    }
    res.json({ message: 'Đã xoá kích thước thành công.' }); // Xoá thành công
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xoá kích thước.' }); // Báo lỗi
  }
};
