const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { validateMiddleware, validationSchemas } = require('../middlewares/validate.middleware');
const reviewController = require('../controllers/review.controller');

// Validation schemas
const reviewSchema = validationSchemas.review;

/**
 * @route   GET /api/reviews/:productId
 * @desc    Lấy danh sách đánh giá của một sản phẩm
 * @access  Public
 */
router.get('/:productId', reviewController.getReviews);

/**
 * Áp dụng middleware xác thực cho các route bên dưới
 * @middleware auth
 */
router.use(auth);

/**
 * @route   POST /api/reviews
 * @desc    Thêm đánh giá mới cho sản phẩm
 * @access  Private
 */
router.post('/', validateMiddleware(reviewSchema), reviewController.addReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Cập nhật đánh giá của người dùng hiện tại
 * @access  Private
 */
router.put('/:id', validateMiddleware(reviewSchema), reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Xóa đánh giá của người dùng hiện tại
 * @access  Private
 */
router.delete('/:id', reviewController.deleteReview);

module.exports = router;