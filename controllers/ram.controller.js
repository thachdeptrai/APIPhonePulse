const Ram = require('../models/Ram');

// ✅ Lấy danh sách tất cả RAM
exports.getAllRam = async (req, res) => {
  try {
    const list = await Ram.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error });
  }
};

// ✅ Thêm RAM mới
exports.addRam = async (req, res) => {
  try {
    const { ram_name } = req.body;
    const newRam = new Ram({ ram_name });
    await newRam.save();
    res.status(201).json({ msg: 'Thêm RAM thành công', data: newRam });
  } catch (error) {
    res.status(400).json({ msg: 'Lỗi khi thêm RAM', error });
  }
};

// ✅ Cập nhật RAM
exports.updateRam = async (req, res) => {
  try {
    const { id } = req.params;
    const { ram_name } = req.body;

    const updated = await Ram.findByIdAndUpdate(
      id,
      { ram_name, modified_date: new Date() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Không tìm thấy RAM' });

    res.json({ msg: 'Cập nhật thành công', data: updated });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error });
  }
};

// ✅ Xoá RAM
exports.deleteRam = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Ram.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ msg: 'Không tìm thấy RAM' });

    res.json({ msg: 'Xoá thành công', data: deleted });
  } catch (error) {
    res.status(500).json({ msg: 'Lỗi server', error });
  }
};
