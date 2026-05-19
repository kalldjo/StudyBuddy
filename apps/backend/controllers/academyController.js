const academyModel = require('../models/academyModel');

const earnCertificate = async (req, res) => {
  try {
    const { courseTitle, titleAwarded, passed } = req.body;
    if (!courseTitle || !titleAwarded || passed === undefined) {
      return res.status(400).json({ error: 'courseTitle, titleAwarded, and passed parameters are required' });
    }
    
    if (!passed) {
      return res.status(400).json({ error: 'You must pass the academic exam to earn this certificate.' });
    }
    
    const certificate = await academyModel.earnCertificate(req.userId, courseTitle, titleAwarded);
    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCertificates = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.userId;
    const certificates = await academyModel.getCertificates(targetUserId);
    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { earnCertificate, getCertificates };
