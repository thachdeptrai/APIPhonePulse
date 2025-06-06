const express = require('express');
const router = express.Router();
const sizeController = require('../controllers/size.controller');

// Lấy tất cả size
router.get('/', sizeController.getAll);

// Lấy một size theo ID
router.get('/:id', sizeController.getById);

// Thêm size mới
router.post('/', sizeController.create);

// Cập nhật size
router.put('/:id', sizeController.update);

// Xóa size
router.delete('/:id', sizeController.delete);

module.exports = router;
