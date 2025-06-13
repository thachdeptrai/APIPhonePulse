const Color = require('../models/Color');

//  Lấy tất cả màu sắc
exports.getAll = async (req, res) => {
  try {
    const colors = await Color.find(); // Tìm tất cả tài liệu (màu) trong collection Color
    res.json(colors); // Trả về danh sách màu dưới dạng JSON
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách màu.' }); // Báo lỗi nếu truy vấn thất bại
  }
};

//  Lấy màu theo ID
exports.getById = async (req, res) => {
  try {
    const color = await Color.findById(req.params._id); // Lấy màu theo _id từ URL
    if (!color) return res.status(404).json({ message: 'Không tìm thấy màu.' }); // Nếu không có thì trả về 404
    res.json(color); // Trả về màu tìm thấy
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy màu.' }); // Báo lỗi server
  }
};

// Thêm mới màu sắc
exports.create = async (req, res) => {
  try {
    const color = new Color(req.body); // Tạo instance mới từ dữ liệu người dùng gửi lên
    const saved = await color.save(); // Lưu màu vào database
    res.status(201).json(saved); // Trả về dữ liệu màu vừa lưu
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi thêm màu.' }); // Lỗi nếu dữ liệu không hợp lệ
  }
};

//  Cập nhật màu theo ID
exports.update = async (req, res) => {
  try {
    const updated = await Color.findByIdAndUpdate(
      req.params._id,      // ID cần cập nhật
      req.body,           // Dữ liệu mới
      { new: true }       // Trả về document mới sau khi cập nhật
    );
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy màu để cập nhật.' }); // Không tìm thấy thì trả 404
    res.json(updated); // Trả về document đã cập nhật
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi cập nhật màu.' }); // Lỗi nếu dữ liệu không hợp lệ
  }
};

//  Xoá màu theo ID
exports.delete = async (req, res) => {
  try {
    const deleted = await Color.findByIdAndDelete(req.params._id); // Tìm và xoá theo ID
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy màu để xoá.' }); // Không tìm thấy thì trả 404
    res.json({ message: 'Đã xoá màu thành công.' }); // Trả về kết quả thành công
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xoá màu.' }); // Báo lỗi server
  }
};
