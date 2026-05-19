const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academyController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/earn', academyController.earnCertificate);
router.get('/my-credentials', academyController.getCertificates);

module.exports = router;
