const express = require('express');
const router = express.Router();
const playgroundController = require('../controllers/playgroundController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GPA grade routes
router.get('/grades', playgroundController.getGrades);
router.post('/grades', playgroundController.saveGrade);
router.delete('/grades/:id', playgroundController.deleteGrade);

// Flashcard routes
router.get('/flashcards', playgroundController.getFlashcards);
router.post('/flashcards', playgroundController.saveFlashcard);
router.delete('/flashcards/:id', playgroundController.deleteFlashcard);

module.exports = router;
