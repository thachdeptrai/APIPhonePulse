const express = require('express');
const router = express.Router();
const { send ,getNotifications } = require('../controllers/notifications.controller');

// POST /api/notifications/send
router.post('/send', send);
router.get('/log', getNotifications);
module.exports = router;
