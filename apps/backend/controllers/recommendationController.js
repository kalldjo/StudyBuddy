const recommendationModel = require('../models/recommendationModel');

const searchByFilters = async (req, res) => {
  try {
    const { fakultas, jurusan, angkatan } = req.query;
    const data = await recommendationModel.searchByFilters(fakultas, jurusan, angkatan);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recommendByInterest = async (req, res) => {
  try {
    const data = await recommendationModel.recommendByInterest(req.userId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recommendBySkills = async (req, res) => {
  try {
    const data = await recommendationModel.recommendBySkills(req.userId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const recommendBySocialProximity = async (req, res) => {
  try {
    const data = await recommendationModel.recommendBySocialProximity(req.userId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { searchByFilters, recommendByInterest, recommendBySkills, recommendBySocialProximity };
