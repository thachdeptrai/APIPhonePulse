const ProductImage = require('../models/ProductImage');

// Thêm ảnh sản phẩm (bằng link hoặc upload file)
exports.addImage = async (req, res) => {
  try {
    const productId = req.params._id; // Lấy ID sản phẩm từ URL

    // Lấy ảnh từ body (truyền link) hoặc từ file upload (upload dùng multer)
    const image_url = req.body.image_url || req.file?.filename;

    // Nếu không có ảnh nào được gửi lên thì báo lỗi
    if (!image_url) {
      return res.status(400).json({ message: 'Thiếu ảnh' });
    }

    // Tạo bản ghi mới trong bảng ProductImage
    const newImage = new ProductImage({
      product_id: productId,
      image_url: image_url
    });

    // Lưu vào MongoDB
    const saved = await newImage.save();
    res.status(201).json(saved); // Trả về ảnh vừa thêm
  } catch (err) {
    // Báo lỗi nếu có sự cố
    res.status(500).json({ error: err.message });
  }
};

//  Lấy tất cả ảnh của một sản phẩm (theo product_id)
exports.getImages = async (req, res) => {
  try {
    // Tìm tất cả ảnh có product_id khớp với req.params._id
    const images = await ProductImage.find({ product_id: req.params._id });
    res.json(images); // Trả về danh sách ảnh
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có
  }
};

//  Xoá ảnh sản phẩm
exports.deleteImage = async (req, res) => {
  try {
    // Tìm ảnh theo ID trong bảng ProductImage
    const product = await ProductImage.findById(req.params._id);

    // Nếu không tồn tại ảnh thì trả về lỗi
    if (!product || !product.image_url) {
      return res.status(404).json({ message: 'Không có ảnh' });
    }

    // Gán null cho image_url để xem như xoá (nếu không thực sự xoá file khỏi server)
    product.image_url = null;
    await product.save(); // Lưu thay đổi

    res.json({ message: 'Đã xoá ảnh' }); // Trả về thông báo xoá thành công
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};
