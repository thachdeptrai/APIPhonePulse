const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage"); // Import model ProductImage (chứa ảnh sản phẩm)

//  Lấy tất cả sản phẩm
exports.getAll = async (req, res) => {
  try {
    // Tìm tất cả sản phẩm, đồng thời populate trường 'category_id' để lấy thông tin danh mục
    const products = await Product.find()
      .populate("category_id") // Lấy thông tin danh mục
      .populate("productimage_id") // Lấy thông tin ảnh sản phẩm từ model ProductImage
      .populate({
        path: "variant_id",
        populate: ["color_id", "size_id"],
      }); // Lấy thông tin biến thể (màu, dung lượng,...)
    res.json(products); // Trả về danh sách sản phẩm
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};

//  Lấy sản phẩm theo ID
exports.getById = async (req, res) => {
  try {
    // Tìm sản phẩm theo ID, kèm populate danh mục
    const product = await Product.findById(req.params.id)
      .populate("category_id") // Lấy thông tin danh mục
      .populate("productimage_id") // Lấy thông tin ảnh sản phẩm từ model ProductImage
      .populate({
        path: "variant_id",
        populate: ["color_id", "size_id"],
      }); // Lấy thông tin danh mục và biến thể
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // Nếu không tồn tại
    res.json(product); // Trả về sản phẩm tìm được
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};

// Tìm kiếm sản phẩm theo tên
exports.searchByName = async (req, res) => {
  try {
    const keyword = req.query.name || '';
    const products = await Product.find({
      product_name: { $regex: keyword, $options: 'i' }
    })
    .populate("category_id")
    .populate("productimage_id")
    .populate({
      path: "variant_id",
      populate: ["color_id", "size_id"],
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // Nếu không tồn tại
    res.json(updated); // Trả về sản phẩm đã cập nhật
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả về lỗi nếu cập nhật không thành công
  }
};

//  Xoá sản phẩm
exports.delete = async (req, res) => {
  try {
    // Xoá sản phẩm theo ID
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // Nếu không tồn tại
    res.json({ message: "Đã xoá sản phẩm" }); // Trả về thông báo xoá thành công
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};
