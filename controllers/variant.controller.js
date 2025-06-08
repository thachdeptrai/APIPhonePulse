const Variant = require('../models/Variant');

// Lấy tất cả biến thể theo product ID
exports.getAll = async (req, res) => {
  try {
    // Tìm tất cả các biến thể có product_id khớp với ID được truyền vào từ URL
    const variants = await Variant.find({ product_id: req.params.id });
    res.json(variants); // Trả về danh sách biến thể
  } catch (error) {
    // Trả về lỗi nếu có sự cố server
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách biến thể.' });
  }
};

//  Lấy một biến thể theo ID
exports.getById = async (req, res) => {
  try {
    // Tìm biến thể theo ID (variantId được truyền qua URL)
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể.' }); // Nếu không tồn tại
    res.json(variant); // Trả về biến thể tìm được
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy biến thể.' }); // Lỗi server
  }
};

// Tạo mới biến thể
exports.add = async (req, res) => {
  try {
    // Tạo mới biến thể, gán thêm product_id từ URL vào body gửi lên
    const variant = new Variant({ ...req.body, product_id: req.params.id });
    const saved = await variant.save(); // Lưu vào MongoDB
    res.status(201).json(saved); // Trả về biến thể mới tạo
  } catch (error) {
    // Trả về lỗi nếu dữ liệu không hợp lệ hoặc thiếu
    res.status(400).json({ message: 'Lỗi khi tạo biến thể.' });
  }
};

// Cập nhật biến thể (nâng cấp)
exports.update = async (req, res) => {
  try {
    req.body.modified_date = new Date(); // Gán thời gian hiện tại vào trường modified_date

    // Cập nhật biến thể theo ID, trả về bản ghi đã cập nhật
    const updated = await Variant.findByIdAndUpdate(
      req.params.variantId, // ID của biến thể cần cập nhật
      req.body,             // Dữ liệu cập nhật
      { new: true }         // Trả về document mới sau khi cập nhật
    );

    if (!updated) return res.status(404).json({ message: 'Không tìm thấy biến thể để cập nhật.' }); // Không tìm thấy
    res.json(updated); // Trả về bản ghi đã cập nhật
  } catch (error) {
    // Trả về lỗi nếu có vấn đề khi cập nhật
    res.status(400).json({ message: 'Lỗi khi cập nhật biến thể.', error });
  }
};

//  Xoá biến thể
exports.delete = async (req, res) => {
  try {
    // Tìm và xoá biến thể theo ID
    const deleted = await Variant.findByIdAndDelete(req.params.variantId);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy biến thể để xoá.' }); // Không tồn tại
    res.json({ message: 'Đã xoá thành công.' }); // Xoá thành công
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xoá biến thể.' }); // Lỗi server
  }
};
