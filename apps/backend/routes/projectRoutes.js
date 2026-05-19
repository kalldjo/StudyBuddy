const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/user/:userId', projectController.getUserProjects);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
