const Product = require('../models/Product'); 
const ProductImage = require('../models/ProductImage');   // Import model ProductImage (chứa ảnh sản phẩm)

//  Lấy tất cả sản phẩm
exports.getAll = async (req, res) => {
  try {
    // Tìm tất cả sản phẩm, đồng thời populate trường 'category_id' để lấy thông tin danh mục
    const products = await Product.find().populate('category_id');
    res.json(products); // Trả về danh sách sản phẩm
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};

//  Lấy sản phẩm theo ID
exports.getById = async (req, res) => {
  try {
    // Tìm sản phẩm theo ID, kèm populate danh mục
    const product = await Product.findById(req.params._id).populate('category_id');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' }); // Nếu không tồn tại
    res.json(product); // Trả về sản phẩm tìm được
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};

//  Tạo sản phẩm mới
exports.add = async (req, res) => {
  try {
    const newProduct = new Product(req.body); // Tạo instance mới từ dữ liệu client gửi lên
    const saved = await newProduct.save(); // Lưu vào database
    res.status(201).json(saved); // Trả về sản phẩm mới với mã 201 (created)
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả về lỗi nếu dữ liệu không hợp lệ
  }
};

// Cập nhật sản phẩm
exports.update = async (req, res) => {
  try {
    // Tìm và cập nhật sản phẩm theo ID với dữ liệu mới, trả về bản mới nhất
    const updated = await Product.findByIdAndUpdate(req.params._id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' }); // Nếu không tồn tại
    res.json(updated); // Trả về sản phẩm đã cập nhật
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả về lỗi nếu cập nhật không thành công
  }
};

//  Xoá sản phẩm
exports.delete = async (req, res) => {
  try {
    // Xoá sản phẩm theo ID
    const deleted = await Product.findByIdAndDelete(req.params._id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' }); // Nếu không tồn tại
    res.json({ message: 'Đã xoá sản phẩm' }); // Trả về thông báo xoá thành công
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};

