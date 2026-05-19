const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', opportunityController.createOpportunity);
router.get('/', opportunityController.getOpportunities);

module.exports = router;
