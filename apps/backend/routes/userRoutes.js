const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.put('/profile', userController.updateProfile);
router.put('/academic', userController.updateAcademic);
router.put('/interests', userController.updateInterests);
router.put('/skills', userController.updateSkills);
router.get('/:id', userController.getUserProfile);

module.exports = router;
