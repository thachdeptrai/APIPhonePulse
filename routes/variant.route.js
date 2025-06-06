const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');

// Lấy tất cả biến thể của sản phẩm
router.get('/:id/variants', variantController.getAll);

// Lấy 1 biến thể cụ thể
router.get('/:id/variants/:variantId', variantController.getById);

// Tạo biến thể cho sản phẩm
router.post('/:id/variants', variantController.add);

// Cập nhật biến thể
router.put('/:id/variants/:variantId', variantController.update);

// Xoá biến thể
router.delete('/:id/variants/:variantId', variantController.delete);

module.exports = router;
