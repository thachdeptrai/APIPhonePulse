const express = require('express');
const router = express.Router();
const adminController = require('../controllers/ChatAdmin.controller');
const { authenticateToken } = require('../middlewares/chatauth');

router.get('/rooms/waiting', adminController.getWaitingRooms);
router.get('/rooms/active/:adminId', adminController.getActiveRooms);
router.get('/rooms/:roomId/unread-count', adminController.getUnreadCount);
router.get('/messages/:roomId?limit=1&sort=-timestamp', adminController.getLastMessage);
router.post('/room/join', adminController.joinRoom);

module.exports = router;