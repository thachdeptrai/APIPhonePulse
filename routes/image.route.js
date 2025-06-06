const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams để lấy được :id từ URL cha
const imageController = require('../controllers/image.controller');
const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu hình ảnh
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload ảnh
router.post('/', upload.single('image'), imageController.uploadImage);

// Xóa ảnh
router.delete('/', imageController.deleteImage);

module.exports = router;
