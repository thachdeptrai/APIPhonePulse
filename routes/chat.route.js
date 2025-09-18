const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatRoom.controller');


router.post('/room', chatController.createOrGetRoom);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.post('/ask-ai', chatController.askAI);

module.exports = router;
