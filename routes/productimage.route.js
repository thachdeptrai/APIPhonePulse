const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams để truy cập req.params từ router cha nếu cần

const multer = require('multer');         // Thư viện xử lý upload file
const path = require('path');             // Dùng để lấy phần mở rộng của file
const productImageController = require('../controllers/productimage.controller');

//  Cấu hình Multer để lưu ảnh vào thư mục "uploads/"
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), // Đường dẫn thư mục lưu file
  filename: (req, file, cb) => {
    // Đặt tên file là timestamp + đuôi gốc của ảnh 
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage }); // Khởi tạo middleware upload

// ===========================
//  Thêm ảnh sản phẩm
// ===========================
// POST /products/:id/images
// Hỗ trợ upload file (form-data) hoặc link (JSON body)
router.post('/:id/images', upload.single('image'), productImageController.addImage);

// ===========================
//  Lấy danh sách ảnh theo product_id
// ===========================
// GET /products/:id/images
router.get('/:id/images', productImageController.getImages);

// ===========================
//  Xoá ảnh theo ID ảnh (không phải product_id)
// ===========================
// DELETE /products/:id/images?imageId=<ID của ảnh>
router.delete('/:id/images', productImageController.deleteImage);

module.exports = router;
