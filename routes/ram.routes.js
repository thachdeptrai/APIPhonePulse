const express = require('express');
const router = express.Router();
const ramCtrl = require('../controllers/ram.controller');

// Lấy danh sách RAM
router.get('/', ramCtrl.getAllRam);

// Thêm RAM
router.post('/', ramCtrl.addRam);

// Sửa RAM theo id
router.put('/:id', ramCtrl.updateRam);

// Xoá RAM theo id
router.delete('/:id', ramCtrl.deleteRam);

module.exports = router;
