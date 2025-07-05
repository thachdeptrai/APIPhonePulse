const ProductImage = require('../models/ProductImage');
const fs = require('fs');
const path = require('path');

// Thêm ảnh sản phẩm bằng link hoặc upload file
exports.addImage = async (req, res) => {
  try {
    const productId = req.params.id; // 🔍 Lấy product_id từ URL

    //  Lấy đường dẫn ảnh: ưu tiên link (từ body), nếu không có thì lấy từ file upload
    const image_url = req.body.image_url || (req.file && `/uploads/${req.file.filename}`);

    //  Nếu không có ảnh thì báo lỗi
    if (!image_url) {
      return res.status(400).json({ message: 'Thiếu ảnh' });
    }

    //  Tạo bản ghi mới trong bảng ProductImage
    const newImage = new ProductImage({
      product_id: productId,
      image_url: image_url
    });

    //  Lưu ảnh vào MongoDB
    const saved = await newImage.save();

    //  Trả về ảnh đã lưu
    res.status(201).json(saved);
  } catch (err) {
    //  Báo lỗi nếu có sự cố trong quá trình xử lý
    res.status(500).json({ error: err.message });
  }
};

// ✅ Lấy tất cả ảnh của một sản phẩm
exports.getImages = async (req, res) => {
  try {
    //  Tìm các ảnh theo product_id trong bảng ProductImage
    const images = await ProductImage.find({ product_id: req.params.id });

    //  Trả về danh sách ảnh
    res.json(images);
  } catch (err) {
    //  Trả về lỗi nếu có sự cố
    res.status(500).json({ error: err.message });
  }
};

// Xoá ảnh sản phẩm (theo imageId, không phải productId)
exports.deleteImage = async (req, res) => {
  try {
    const imageId = req.query.imageId; //  Lấy ID ảnh từ query (VD: ?imageId=abc123)

    if (!imageId) {
      return res.status(400).json({ message: 'Thiếu imageId để xoá' });
    }

    //  Tìm ảnh theo ID
    const image = await ProductImage.findById(imageId);

    //  Nếu ảnh không tồn tại
    if (!image || !image.image_url) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }

    //  Nếu ảnh là file nội bộ (trong thư mục uploads), thì xoá file
    if (image.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', image.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); //  Xoá file ảnh khỏi ổ đĩa
      }
    }

    // 🗑 Xoá bản ghi ảnh khỏi MongoDB
    await ProductImage.findByIdAndDelete(imageId);

    //  Trả về thông báo xoá thành công
    res.json({ message: 'Đã xoá ảnh thành công' });
  } catch (err) {
    //  Báo lỗi nếu có
    res.status(500).json({ error: err.message });
  }
};
