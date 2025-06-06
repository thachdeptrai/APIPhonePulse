const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware'); // middleware xác thực
const cartController = require('../controllers/cart.controller'); // controller xử lý

router.use(auth); // Áp dụng xác thực cho toàn bộ route

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/', cartController.updateCartItem);
router.delete('/', cartController.removeFromCart);

module.exports = router;

