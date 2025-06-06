const Cart = require("../models/Cart");

class CartController {
  /**
   * @route   GET /api/cart
   * @desc    Lấy thông tin giỏ hàng của người dùng hiện tại
   * @access  Private
   */
  static async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ userId: req.user.id })
        .populate("items.productId")
        .populate("items.variantId");
      res.status(200).json({
        success: true,
        message: "Lấy thông tin giỏ hàng thành công",
        data: cart || { userId: req.user.id, items: [] },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   POST /api/cart
   * @desc    Thêm sản phẩm vào giỏ hàng
   * @access  Private
   */
  static async addToCart(req, res) {
    const { productId, variantId, quantity } = req.body;
    try {
      let cart = await Cart.findOne({ userId: req.user.id });
      if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.variantId.toString() === variantId
      );

      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        cart.items.push({ productId, variantId, quantity: quantity || 1 });
      }

      await cart.save();
      res.status(200).json({
        success: true,
        message: "Thêm sản phẩm vào giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   PUT /api/cart
   * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
   * @access  Private
   */
  static async updateCartItem(req, res) {
    const { productId, variantId, quantity } = req.body;
    try {
      const cart = await Cart.findOne({ userId: req.user.id });
      if (!cart)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });

      const item = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.variantId.toString() === variantId
      );

      if (!item)
        return res
          .status(404)
          .json({
            success: false,
            message: "Không tìm thấy sản phẩm trong giỏ hàng",
          });

      item.quantity = quantity;
      await cart.save();
      res.status(200).json({
        success: true,
        message: "Cập nhật số lượng sản phẩm thành công",
        data: cart,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @route   DELETE /api/cart
   * @desc    Xóa sản phẩm khỏi giỏ hàng
   * @access  Private
   */
  static async removeFromCart(req, res) {
    const { productId, variantId } = req.body;
    try {
      const cart = await Cart.findOneAndUpdate(
        { userId: req.user.id },
        { $pull: { items: { productId, variantId } } },
        { new: true }
      );
      if (!cart)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });

      res.status(200).json({
        success: true,
        message: "Xóa sản phẩm khỏi giỏ hàng thành công",
        data: cart,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CartController;
