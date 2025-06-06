const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const favController = require('../controllers/favourite.controller');

router.use(auth);

router.get('/', favController.getFavourites);
router.post('/', favController.addFavourite);
router.delete('/', favController.removeFavourite);

module.exports = router;
