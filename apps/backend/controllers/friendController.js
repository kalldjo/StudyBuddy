const friendModel = require('../models/friendModel');
const notificationModel = require('../models/notificationModel');
const { getSession } = require('../config/neo4j');

// helper — ambil nama user dari db tanpa bikin model sendiri
const getUserName = async (userId) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (u:User {id: $userId}) RETURN u.name AS name', { userId });
    return result.records[0]?.get('name') || 'Seseorang';
  } finally {
    await session.close();
  }
};

// helper — emit notif real-time via socket jika user online
const emitNotification = (targetUserId, notification) => {
  if (global.io) {
    global.io.to(targetUserId).emit('new_notification', notification);
  }
};

const addFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    await friendModel.addFriendRequest(req.userId, targetId);

    // kirim notif ke target bahwa ada yang minta pertemanan
    const senderName = await getUserName(req.userId);
    const notif = await notificationModel.createNotification(
      targetId,
      `${senderName} mengirimkan permintaan pertemanan kepada kamu.`,
      'friend_request'
    );
    if (notif) emitNotification(targetId, notif);

    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    const success = await friendModel.acceptFriendRequest(req.userId, targetId);
    if (success) {
      // notifikasi balik ke yang ngirim request bahwa requestnya diterima
      const acceptorName = await getUserName(req.userId);
      const notif = await notificationModel.createNotification(
        targetId,
        `${acceptorName} menerima permintaan pertemanan kamu. Sekarang kalian terhubung!`,
        'friend_accepted'
      );
      if (notif) emitNotification(targetId, notif);

      res.json({ success: true, message: 'Friend request accepted' });
    } else {
      res.status(404).json({ error: 'Friend request not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    await friendModel.rejectFriendRequest(req.userId, targetId);
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await friendModel.getPendingRequests(req.userId);
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const friends = await friendModel.getFriendsList(req.userId);
    res.json({ data: friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    await friendModel.removeFriend(req.userId, targetId);
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addFriend, acceptFriend, rejectFriend, getPendingRequests, getFriends, removeFriend };
