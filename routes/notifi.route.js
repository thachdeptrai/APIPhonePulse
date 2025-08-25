const express = require('express');
const router = express.Router();
const { send } = require('../controllers/notifications.controller');

// POST /api/notifications/send
router.post('/send', send);

module.exports = router;
