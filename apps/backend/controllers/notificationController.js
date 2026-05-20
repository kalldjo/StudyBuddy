const notificationModel = require('../models/notificationModel');

// GET /notifications - ambil semua notif user yang login
const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel.getUserNotifications(req.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /notifications/unread-count - jumlah notif belum baca buat badge
const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationModel.getUnreadCount(req.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /notifications/mark-read - tandai semua sebagai dibaca
const markAllRead = async (req, res) => {
  try {
    const updated = await notificationModel.markAllRead(req.userId);
    res.json({ success: true, message: `${updated} notifications marked as read` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications, getUnreadCount, markAllRead };
