const Favourite = require('../models/Favourite');

// GET /api/favourites
exports.getFavourites = async (req, res) => {
    try {
        const favourites = await Favourite.findOne({ userId: req.user.id }).populate('products');
        res.json(favourites || { userId: req.user.id, products: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/favourites
exports.addFavourite = async (req, res) => {
    const { productId } = req.body;
    try {
        let fav = await Favourite.findOne({ userId: req.user.id });
        if (!fav) fav = new Favourite({ userId: req.user.id, products: [] });

        if (!fav.products.includes(productId)) {
            fav.products.push(productId);
        }

        await fav.save();
        res.json(fav);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/favourites
exports.removeFavourite = async (req, res) => {
    const { productId } = req.body;
    try {
        const fav = await Favourite.findOneAndUpdate(
            { userId: req.user.id },
            { $pull: { products: productId } },
            { new: true }
        );
        res.json(fav);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
