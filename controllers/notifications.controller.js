// controllers/notificationController.js
const { sendBroadcast, sendPersonalized } = require('../services/notification.service');

async function send(req, res) {
    const { type, userIds, title, body } = req.body;

    if(!type || !['broadcast','personalized'].includes(type)) {
        return res.status(400).json({ success:false, message:'Invalid type' });
    }

    if(type === 'broadcast') {
        if(!title || !body) return res.status(400).json({ success:false, message:'Missing title/body' });
        const result = await sendBroadcast(title, body);
        return res.json(result);
    }

    if(type === 'personalized') {
        if(!userIds || !Array.isArray(userIds)) return res.status(400).json({ success:false, message:'Missing userIds' });
        const result = await sendPersonalized(userIds);
        return res.json(result);
    }
}

module.exports = { send };
