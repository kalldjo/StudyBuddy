const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/add', friendController.addFriend);
router.post('/accept', friendController.acceptFriend);
router.post('/reject', friendController.rejectFriend);
router.get('/requests', friendController.getPendingRequests);
router.get('/list', friendController.getFriends);

module.exports = router;
