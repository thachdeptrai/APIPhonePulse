const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const User = require('../models/User');

// 1. Broadcast cho tất cả user
async function sendBroadcast(title, body) {
    try {
        const users = await User.find({ fcm_token: { $exists: true, $ne: "" } });
        const tokens = users.map(u => u.fcm_token);

        if(tokens.length === 0) return { message: 'No tokens found' };

        const batches = [];
        while(tokens.length) batches.push(tokens.splice(0, 500)); // FCM max 500 tokens

        let sent = 0, failed = 0;
        for(const batch of batches){
            const response = await admin.messaging().sendMulticast({
                notification: { title, body },
                tokens: batch
            });
            sent += response.successCount;
            failed += response.failureCount;
        }

        await Notification.create({
            title, body, userIds: users.map(u=>u._id), type:'broadcast', status:'sent'
        });

        return { success: true, sent, failed };
    } catch(err){
        return { success: false, error: err.message };
    }
}

// 2. Personalized message cho từng user
    async function sendPersonalized(userIds, messageTemplate) {
    try {
        const users = await User.find({ _id: { $in: userIds }, fcm_token: { $exists: true, $ne: "" } });
        const results = [];

        for(const user of users){
            // Thay <username> bằng tên user
            const body = messageTemplate.replace(/<username>/g, user.name);

            const message = {
                notification: {
                    title: 'Thông báo cá nhân', // hoặc admin nhập title
                    body: body
                },
                token: user.fcm_token
            };

            await admin.messaging().send(message);
            results.push({ user: user.name, success: true });
        }

        await Notification.create({
            title: 'Personalized',
            body: messageTemplate,
            userIds: users.map(u=>u._id),
            type: 'personalized',
            status: 'sent'
        });

        return { success: true, details: results };
    } catch(err){
        return { success: false, error: err.message };
    }
}

async function getAllNotifications() {
    try {
        return await Notification.find().sort({ createdAt: -1 }).lean();
      } catch(err) {
        console.error('getAllNotifications error:', err);
        throw err;
      }
}

module.exports = { sendBroadcast, sendPersonalized ,getAllNotifications};
