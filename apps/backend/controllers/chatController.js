const chatModel = require('../models/chatModel');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId and content are required' });
    }
    
    const message = await chatModel.sendMessage(req.userId, receiverId, content);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { buddyId } = req.params;
    if (!buddyId) {
      return res.status(400).json({ error: 'buddyId parameter is required' });
    }
    
    const messages = await chatModel.getMessages(req.userId, buddyId);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessages };
