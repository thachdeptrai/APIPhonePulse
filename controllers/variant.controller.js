const Variant = require('../models/Variant');

// Lấy tất cả biến thể theo product ID
exports.getAll = async (req, res) => {
  try {
    const variants = await Variant.find({ product_id: req.params.id });
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách biến thể.' });
  }
};

// Lấy một biến thể theo ID
exports.getById = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể.' });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy biến thể.' });
  }
};

// Tạo mới biến thể
exports.add = async (req, res) => {
  try {
    const variant = new Variant({ ...req.body, product_id: req.params.id });
    const saved = await variant.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi tạo biến thể.' });
  }
};

// Cập nhật biến thể (nâng cấp)
exports.update = async (req, res) => {
    try {
      req.body.modified_date = new Date(); // cập nhật thời gian sửa
      const updated = await Variant.findByIdAndUpdate(
        req.params.variantId,
        req.body,
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Không tìm thấy biến thể để cập nhật.' });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Lỗi khi cập nhật biến thể.', error });
    }
  };
  

// Xoá biến thể
exports.delete = async (req, res) => {
  try {
    const deleted = await Variant.findByIdAndDelete(req.params.variantId);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy biến thể để xoá.' });
    res.json({ message: 'Đã xoá thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xoá biến thể.' });
  }
};
