const Favourite = require('../models/Favourite');

class FavouriteController {
    /**
     * @route   GET /api/favourites
     * @desc    Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
     * @access  Private
     */
static async getFavourites(req, res) {
  try {
    const favourites = await Favourite.find({ userId: req.user._id })
      .populate({
        path: 'productId',
        model: 'Product',
        populate: {
          path: 'category_id',
          model: 'Category'
        }
      })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách yêu thích thành công',
      data: favourites,
    });
  } catch (error) {
    console.error("Lỗi trong getFavourites:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách yêu thích.',
      error: error.message
    });
  }
}


    /**
     * @route   POST /api/favourites
     * @desc    Thêm sản phẩm vào danh sách yêu thích
     * @access  Private
     */
    static async addFavourite(req, res) {
        // console.log("req.user = ", req.user); // Bỏ comment nếu cần debug
        const { productId } = req.body;
        // Kiểm tra productId có hợp lệ không (ví dụ: có phải là ObjectId hợp lệ không)
        // if (!mongoose.Types.ObjectId.isValid(productId)) {
        //     return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        // }

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
                // addedAt: new Date(), // Mongoose sẽ tự thêm timestamp nếu bạn có `timestamps: true` trong schema
            });
            await favourite.save();
            res.status(201).json({ // Sử dụng 201 Created khi tạo mới thành công
                success: true,
                message: 'Thêm sản phẩm vào danh sách yêu thích thành công',
                data: favourite,
            });
        } catch (error) {
            console.error("Lỗi trong addFavourite:", error);
            res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ khi thêm vào yêu thích.',
                error: error.message
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
        // if (!mongoose.Types.ObjectId.isValid(productId)) {
        //     return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        // }

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
                data: favourite, // Có thể chỉ trả về message hoặc ID của đối tượng đã xóa
            });
        } catch (error) {
            console.error("Lỗi trong removeFavourite:", error);
            res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ khi xóa khỏi yêu thích.',
                error: error.message
            });
        }
    }
}

module.exports = FavouriteController;