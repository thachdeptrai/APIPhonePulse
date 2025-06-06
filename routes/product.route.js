const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middlewares/upload.middleware'); // middleware xử lý upload ảnh

// Lấy tất cả sản phẩm
router.get('/', productController.getAll);

// Lấy sản phẩm theo ID
router.get('/:id', productController.getById);

// Tạo sản phẩm mới
router.post('/', productController.add);

// Cập nhật sản phẩm
router.put('/:id', productController.update);

// Xoá sản phẩm
router.delete('/:id', productController.delete);

// Upload ảnh sản phẩm
router.post('/:id/images', upload.single('image'), productController.uploadImage);

// Xoá ảnh sản phẩm
router.delete('/:id/images', productController.deleteImage);

module.exports = router;
