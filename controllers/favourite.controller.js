const Favourite = require('../models/Favourite');

class FavouriteController {
    /**
     * @route   GET /api/favourites
     * @desc    Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
     * @access  Private
     */
    static async getFavourites(req, res) {
        try {
            const favourites = await Favourite.find({ userId: req.user._id }).populate('productId');
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách yêu thích thành công',
                data: favourites,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   POST /api/favourites
     * @desc    Thêm sản phẩm vào danh sách yêu thích
     * @access  Private
     */
    static async addFavourite(req, res) {
        console.log("req.user = ", req.user);
        const { productId } = req.body;
        try {
            const existingFavourite = await Favourite.findOne({
                userId: req.user._id,
                productId,
            });
            if (existingFavourite) {
                return res.status(400).json({
                    success: false,
                    message: 'Sản phẩm đã có trong danh sách yêu thích',
                });
            }

            const favourite = new Favourite({
                userId: req.user._id,
                productId,
                addedAt: new Date(),
            });
            await favourite.save();
            res.status(200).json({
                success: true,
                message: 'Thêm sản phẩm vào danh sách yêu thích thành công',
                data: favourite,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   DELETE /api/favourites
     * @desc    Xóa sản phẩm khỏi danh sách yêu thích
     * @access  Private
     */
    static async removeFavourite(req, res) {
        const { productId } = req.body;
        try {
            const favourite = await Favourite.findOneAndDelete({
                userId: req.user._id,
                productId,
            });
            if (!favourite) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm trong danh sách yêu thích',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm khỏi danh sách yêu thích thành công',
                data: favourite,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = FavouriteController;