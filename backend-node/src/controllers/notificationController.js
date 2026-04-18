const { Notification } = require('../models');

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.sub;
        const notifications = await Notification.findAll({
            where: { userId, isRead: false },
            order: [['createdAt', 'DESC']]
        });
        res.json({ data: notifications });
    } catch (e) {
        console.error('Error fetching notifications:', e);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;
        
        const notif = await Notification.findOne({ where: { id, userId } });
        if (!notif) return res.status(404).json({ error: 'Notification not found' });

        notif.isRead = true;
        await notif.save();
        
        res.json({ message: 'Notification marked as read' });
    } catch (e) {
        console.error('Error marking notification read:', e);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
