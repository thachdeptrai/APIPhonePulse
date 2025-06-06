const Cart = require('../models/Cart');

// GET /api/cart
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        res.json(cart || { userId: req.user.id, items: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/cart
exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity || 1;
        } else {
            cart.items.push({ productId, quantity });
        }
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/cart
exports.updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (item) item.quantity = quantity;
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/cart
exports.removeFromCart = async (req, res) => {
    const { productId } = req.body;
    try {
        const cart = await Cart.findOneAndUpdate(
            { userId: req.user.id },
            { $pull: { items: { productId } } },
            { new: true }
        );
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
