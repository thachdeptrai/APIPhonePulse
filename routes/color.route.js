const express = require('express');
const router = express.Router();
const colorController = require('../controllers/color.controller');

// Lấy tất cả màu
router.get('/', colorController.getAll);

// Lấy một màu theo ID
router.get('/:id', colorController.getById);

// Thêm màu mới
router.post('/', colorController.create);

// Cập nhật màu
router.put('/:id', colorController.update);

// Xóa màu
router.delete('/:id', colorController.delete);

module.exports = router;
