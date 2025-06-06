const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Lấy tất cả danh mục
router.get('/', categoryController.getAll);

// Lấy 1 danh mục theo ID
router.get('/:id', categoryController.getById);

// Tạo danh mục mới
router.post('/', categoryController.add);

// Cập nhật danh mục
router.put('/:id', categoryController.update);

// Xoá danh mục
router.delete('/:id', categoryController.delete);

module.exports = router;
