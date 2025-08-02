const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const Color = require("../models/Color");
const Size = require("../models/Size");
const ProductImage = require("../models/ProductImage"); // Đảm bảo import ProductImage

class CartController {
  // Hàm trợ giúp để populate giỏ hàng và gán ảnh
  // Hàm này sẽ được gọi sau mỗi thao tác (GET, POST, PUT, DELETE) để trả về dữ liệu nhất quán
  static async _populateCartAndAddImages(userId) { // Chỉ cần userId, không cần truyền cart vào nữa
    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId', // Populate thông tin sản phẩm chính
        model: 'Product',
        // KHÔNG POPULATE product_images Ở ĐÂY!
        // Chỉ chọn các trường bạn muốn từ Product model
        select: 'product_name original_price discount_percent' // Ví dụ các trường bạn muốn
      })
      .populate({
        path: 'items.variantId', // Populate thông tin biến thể
        model: 'Variant',
        populate: [
          {
            path: 'color_id',
            model: 'Color',
            select: 'color_name'
          },
          {
            path: 'size_id',
            model: 'Size',
            select: 'size_name storage ram'
          }
        ]
      })
      .lean(); // Sử dụng .lean() để có thể chỉnh sửa đối tượng

    if (populatedCart && populatedCart.items.length > 0) {
      const productIds = populatedCart.items.map(item => item.productId?._id).filter(Boolean);

      // Truy vấn ảnh theo danh sách productId từ collection ProductImage riêng
      const productImages = await ProductImage.find({ product_id: { $in: productIds } }).lean();

      // Gán ảnh thumbnail (hoặc ảnh đầu tiên) tương ứng cho từng sản phẩm trong cart
      populatedCart.items = populatedCart.items.map(item => {
        const product = item.productId;
        if (!product) {
            // Nếu sản phẩm không tìm thấy (có thể đã bị xóa khỏi DB)
            console.warn(`Product data missing for cart item: ${item._id}`);
            return {
                ...item,
                productImage: null // Trả về null hoặc một ảnh placeholder URL
            };
        }
        // Tìm ảnh thumbnail cho sản phẩm này
        const image = productImages.find(img => img.product_id.toString() === product._id.toString());

        // Nếu bạn có trường is_thumbnail trong ProductImage model và muốn lấy thumbnail
        // const thumbnail = productImages.find(img => img.product_id.toString() === product._id.toString() && img.is_thumbnail);
        // return { ...item, productImage: thumbnail ? thumbnail.image_url : (image ? image.image_url : null) };

        return {
          ...item,
          productImage: image ? image.image_url : null // Trả về null nếu không có ảnh
        };
      });
    }
    return populatedCart || { userId, items: [] }; // Đảm bảo trả về một giỏ hàng rỗng nếu không tìm thấy
  }

  /**
   * @route   GET /api/cart
   * @desc    Lấy thông tin giỏ hàng của người dùng hiện tại
   * @access  Private
   */
  static async getCart(req, res) {
    console.log("--- GET /api/cart requested ---");
    console.log(`User ID: ${req.user ? req.user._id : 'N/A'} is requesting their cart.`);

    try {
      // Gọi hàm trợ giúp để populate và gán ảnh
      const cart = await CartController._populateCartAndAddImages(req.user._id);

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giỏ hàng thành công",
        data: cart, // cart đã được xử lý để là { userId, items: [] } nếu rỗng
      });

      console.log("GET /api/cart response: Cart information sent successfully.");

    } catch (error) {
      console.error(`ERROR in GET /api/cart for user ${req.user._id}: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }

    console.log("--- GET /api/cart finished ---");
  }

  /**
   * @route   POST /api/cart
   * @desc    Thêm sản phẩm vào giỏ hàng
   * @access  Private
   */
  static async addToCart(req, res) {
    const { productId, variantId, quantity } = req.body;
    console.log("--- POST /api/cart requested ---");
    console.log(`Attempting to add to cart for user: ${req.user._id}`);
    console.log(`Received: Product ID: ${productId}, Variant ID: ${variantId}, Quantity: ${quantity || 1}`);

    try {
      let cart = await Cart.findOne({ userId: req.user._id });

      if (!cart) {
        cart = new Cart({ userId: req.user._id, items: [] });
        console.log(`No existing cart found. Created a new cart for user ${req.user._id}.`);
      } else {
        console.log(`Existing cart found for user ${req.user._id}.`);
      }

      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.variantId.toString() === variantId
      );

      if (existingItem) {
        const oldQuantity = existingItem.quantity;
        existingItem.quantity += quantity || 1;
        console.log(`Item already in cart. Updated quantity from ${oldQuantity} to ${existingItem.quantity} for Variant ID: ${variantId}`);
      } else {
        cart.items.push({ productId, variantId, quantity: quantity || 1 });
        console.log(`New item added to cart: Product ID: ${productId}, Variant ID: ${variantId}, Quantity: ${quantity || 1}`);
      }

      await cart.save();
      console.log("Cart saved successfully after addition.");

      // Sau khi lưu, gọi hàm trợ giúp để populate và gán ảnh
      const updatedAndPopulatedCart = await CartController._populateCartAndAddImages(req.user._id);

      res.status(200).json({
        success: true,
        message: "Thêm sản phẩm vào giỏ hàng thành công",
        data: updatedAndPopulatedCart,
      });
      console.log("POST /api/cart response: Item added/updated in cart.");

    } catch (error) {
      console.error(`ERROR in POST /api/cart for user ${req.user._id}: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
    console.log("--- POST /api/cart finished ---");
  }

  /**
   * @route   PUT /api/cart
   * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
   * @access  Private
   */
  static async updateCartItem(req, res) {
    const { productId, variantId, quantity } = req.body;
    console.log("--- PUT /api/cart requested ---");
    console.log(`Attempting to update cart item for user: ${req.user._id}`);
    console.log(`Received: Product ID: ${productId}, Variant ID: ${variantId}, New Quantity: ${quantity}`);

    try {
      const cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) {
        console.log(`Cart not found for user ${req.user._id}.`);
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }

      const item = cart.items.find(
        (item) =>
          item.productId.toString() === productId &&
          item.variantId.toString() === variantId
      );

      if (!item) {
        console.log(`Item not found in cart for Variant ID: ${variantId}, Product ID: ${productId}.`);
        return res
          .status(404)
          .json({
            success: false,
            message: "Không tìm thấy sản phẩm trong giỏ hàng",
          });
      }

      const oldQuantity = item.quantity;
      item.quantity = quantity;
      await cart.save();
      console.log(`Cart item updated. Variant ID: ${variantId}, Quantity changed from ${oldQuantity} to ${item.quantity}.`);

      // Sau khi lưu, gọi hàm trợ giúp để populate và gán ảnh
      const updatedAndPopulatedCart = await CartController._populateCartAndAddImages(req.user._id);

      res.status(200).json({
        success: true,
        message: "Cập nhật số lượng sản phẩm thành công",
        data: updatedAndPopulatedCart,
      });
      console.log("PUT /api/cart response: Cart item quantity updated.");

    } catch (error) {
      console.error(`ERROR in PUT /api/cart for user ${req.user._id}: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
    console.log("--- PUT /api/cart finished ---");
  }

  /**
   * @route   DELETE /api/cart
   * @desc    Xóa sản phẩm khỏi giỏ hàng
   * @access  Private
   */
  static async removeFromCart(req, res) {
  const { productId, variantId } = req.body;
  console.log("--- DELETE /api/cart requested ---");
  console.log(`Attempting to remove item from cart for user: ${req.user._id}`);
  console.log(`Received: Product ID: ${productId}, Variant ID: ${variantId}`);

  try {
    // 👉 Nếu không có productId và variantId, hiểu là xoá toàn bộ
    if (!productId && !variantId) {
      const cart = await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { items: [] } },
        { new: true }
      );

      if (!cart) {
        console.log(`Cart not found for user ${req.user._id}.`);
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giỏ hàng" });
      }

      console.log(`Cleared entire cart for user ${req.user._id}`);

      const updatedAndPopulatedCart = await CartController._populateCartAndAddImages(req.user._id);

      return res.status(200).json({
        success: true,
        message: "Đã xoá toàn bộ giỏ hàng",
        data: updatedAndPopulatedCart,
      });
    }

    // 👉 Nếu có productId và variantId, xoá theo sản phẩm
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { items: { productId, variantId } } },
      { new: true }
    );

    if (!cart) {
      console.log(`Cart not found for user ${req.user._id}.`);
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giỏ hàng" });
    }

    console.log(`Item removed from cart for user ${req.user._id}. New item count: ${cart.items.length}`);

    const updatedAndPopulatedCart = await CartController._populateCartAndAddImages(req.user._id);

    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      data: updatedAndPopulatedCart,
    });
    console.log("DELETE /api/cart response: Item removed from cart.");
  } catch (error) {
    console.error(`ERROR in DELETE /api/cart for user ${req.user._id}: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  console.log("--- DELETE /api/cart finished ---");
}
}

module.exports = CartController;