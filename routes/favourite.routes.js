const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const favController = require('../controllers/favourite.controller');

// Validation schemas
const favouriteSchema = validationSchemas.favourite;

/**
 * Áp dụng middleware xác thực cho tất cả các route
 * @middleware auth
 */
router.use(auth);

/**
 * @route   GET /api/favourites
 * @desc    Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
 * @access  Private
 */
router.get('/', favController.getFavourites);

/**
 * @route   POST /api/favourites
 * @desc    Thêm sản phẩm vào danh sách yêu thích
 * @access  Private
 */
router.post('/', validateMiddleware(favouriteSchema), favController.addFavourite);

/**
 * @route   DELETE /api/favourites
 * @desc    Xóa sản phẩm khỏi danh sách yêu thích
 * @access  Private
 */
router.delete('/', validateMiddleware(favouriteSchema), favController.removeFavourite);

module.exports = router;
