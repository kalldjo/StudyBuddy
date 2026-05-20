const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/auth');

// Note: If you want search by filters to be public, move it above the middleware.
// Assuming we require auth for recommendations.
router.use(authMiddleware);

router.get('/search', recommendationController.searchByFilters);
router.get('/interests', recommendationController.recommendByInterest);
router.get('/skills', recommendationController.recommendBySkills);
router.get('/social', recommendationController.recommendBySocialProximity);
router.get('/projects', recommendationController.recommendProjects);

module.exports = router;
