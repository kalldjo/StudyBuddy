const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', postController.createPost);
router.get('/', postController.getFeed);
router.post('/:id/like', postController.toggleLike);
router.delete('/:id', postController.deletePost);
router.get('/user/:userId', postController.getUserPosts);
router.post('/:id/comments', postController.addComment);
router.get('/:id/comments', postController.getComments);

module.exports = router;

