const Product = require('../models/Product');

// Lấy tất cả sản phẩm
exports.getAll = async (req, res) => {
  try {
    const products = await Product.find().populate('id_cat');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy sản phẩm theo ID
exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('id_cat');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo sản phẩm mới
exports.add = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật sản phẩm
exports.update = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xoá sản phẩm
exports.delete = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Đã xoá sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload hình ảnh (sử dụng multer)
exports.uploadImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    product.image = req.file.filename; // Lưu tên file ảnh
    await product.save();
    res.json({ message: 'Đã upload ảnh', image: product.image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xoá ảnh của sản phẩm
exports.deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.image) return res.status(404).json({ message: 'Không có ảnh' });

    product.image = null;
    await product.save();
    res.json({ message: 'Đã xoá ảnh' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
