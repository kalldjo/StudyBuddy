const gpaModel = require('../models/gpaModel');
const flashcardModel = require('../models/flashcardModel');

// GPA GRADES

const getGrades = async (req, res) => {
  try {
    const grades = await gpaModel.getGrades(req.userId);
    res.json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveGrade = async (req, res) => {
  try {
    const { name, credits, grade } = req.body;
    if (!name || !grade) return res.status(400).json({ error: 'name and grade are required' });
    const saved = await gpaModel.saveGrade(req.userId, name, credits || 3, grade);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await gpaModel.deleteGrade(req.userId, id);
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FLASHCARDS

const getFlashcards = async (req, res) => {
  try {
    const flashcards = await flashcardModel.getFlashcards(req.userId);
    res.json({ success: true, data: flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveFlashcard = async (req, res) => {
  try {
    const { question, answer, difficulty } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });
    const saved = await flashcardModel.saveFlashcard(req.userId, question, answer, difficulty);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await flashcardModel.deleteFlashcard(req.userId, id);
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getGrades, saveGrade, deleteGrade, getFlashcards, saveFlashcard, deleteFlashcard };
