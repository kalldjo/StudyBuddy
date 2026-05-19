const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.use(authMiddleware);

// Endpoint: POST /api/upload
router.post('/', upload.single('image'), uploadController.uploadImage);

module.exports = router;
