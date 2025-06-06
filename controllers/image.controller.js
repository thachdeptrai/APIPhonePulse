const fs = require('fs');
const path = require('path');
const Product = require('../models/Product'); // Đảm bảo đúng đường dẫn model

// 📤 Upload hình ảnh sản phẩm
exports.uploadImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const imagePath = req.file.path;

    // Cập nhật field image trong bảng Product
    const product = await Product.findByIdAndUpdate(
      productId,
      { image: imagePath },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    res.json({ message: 'Tải ảnh lên thành công', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🗑️ Xoá hình ảnh sản phẩm
exports.deleteImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product || !product.image) {
      return res.status(404).json({ message: 'Không tìm thấy hình ảnh để xoá' });
    }

    // Xoá file vật lý khỏi server
    fs.unlinkSync(path.resolve(product.image));

    // Xoá đường dẫn hình trong database
    product.image = '';
    await product.save();

    res.json({ message: 'Xóa hình ảnh thành công', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
