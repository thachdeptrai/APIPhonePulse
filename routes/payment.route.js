// routes/payment.route.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/momo', paymentController.createMomoPayment);

module.exports = router;
