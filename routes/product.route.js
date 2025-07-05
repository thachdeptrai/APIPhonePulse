const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Tìm kiếm sản phẩm
router.get('/search', productController.getName);
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

module.exports = router;
