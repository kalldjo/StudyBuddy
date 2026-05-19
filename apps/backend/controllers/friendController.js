const friendModel = require('../models/friendModel');

const addFriend = async (req, res) => {
  try {
    const { targetId } = req.body;
    await friendModel.addFriendRequest(req.userId, targetId);
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
    const friends = await friendModel.getFriends(req.userId);
    res.json({ data: friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { addFriend, acceptFriend, rejectFriend, getPendingRequests, getFriends };
