const express = require('express');
const router = express.Router();
const adminController = require('../controllers/ChatAdmin.controller');
const { authenticateToken } = require('../middlewares/chatauth');

router.get('/rooms/waiting', adminController.getWaitingRooms);
router.get('/rooms/active/:adminId', adminController.getActiveRooms);
router.post('/room/join', adminController.joinRoom);

module.exports = router;