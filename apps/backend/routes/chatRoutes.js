const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', chatController.sendMessage);
router.get('/:buddyId', chatController.getMessages);

module.exports = router;
