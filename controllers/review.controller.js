const Review = require('../models/Review');

class ReviewController {
    /**
     * @route   GET /api/reviews/:productId
     * @desc    Lấy danh sách đánh giá của một sản phẩm
     * @access  Public
     */
    static async getReviews(req, res) {
        try {
            const { productId } = req.params;
            const reviews = await Review.find({ productId }).populate('userId', 'name avatar_url');
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách đánh giá thành công',
                data: reviews,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   POST /api/reviews
     * @desc    Thêm đánh giá mới cho sản phẩm
     * @access  Private
     */
    static async addReview(req, res) {
        const { productId, content, images, number_of_stars } = req.body;
        try {
            const review = new Review({
                userId: req.user.id,
                productId,
                content,
                images,
                number_of_stars,
                created_date: new Date(),
                modified_date: new Date(),
            });
            await review.save();
            res.status(201).json({
                success: true,
                message: 'Thêm đánh giá thành công',
                data: review,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   PUT /api/reviews/:id
     * @desc    Cập nhật đánh giá của người dùng hiện tại
     * @access  Private
     */
    static async updateReview(req, res) {
        const { content, images, number_of_stars } = req.body;
        const { id } = req.params;
        try {
            const review = await Review.findOne({ _id: id, userId: req.user.id });
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa',
                });
            }
            review.content = content || review.content;
            review.images = images || review.images;
            review.number_of_stars = number_of_stars || review.number_of_stars;
            review.modified_date = new Date();
            await review.save();
            res.status(200).json({
                success: true,
                message: 'Cập nhật đánh giá thành công',
                data: review,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   DELETE /api/reviews/:id
     * @desc    Xóa đánh giá của người dùng hiện tại
     * @access  Private
     */
    static async deleteReview(req, res) {
        const { id } = req.params;
        try {
            const review = await Review.findOneAndDelete({ _id: id, userId: req.user.id });
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Xóa đánh giá thành công',
                data: review,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = ReviewController;