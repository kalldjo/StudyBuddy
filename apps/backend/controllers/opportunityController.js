const opportunityModel = require('../models/opportunityModel');

const createOpportunity = async (req, res) => {
  try {
    const { company, role, info, link, logoBg } = req.body;
    if (!company || !role || !info) {
      return res.status(400).json({ error: 'company, role, and info are required' });
    }
    
    // Auto-generate soft gradient backgrounds if no logoBg provided
    const gradients = ['bg-[#003B95]', 'bg-[#0E49B5]', 'bg-[#42B549]', 'bg-[#FF9900]', 'bg-[#EA4335]', 'bg-[#4285F4]'];
    const chosenBg = logoBg || gradients[Math.floor(Math.random() * gradients.length)];
    
    const opportunity = await opportunityModel.createOpportunity(
      req.userId,
      company,
      role,
      info,
      link || '',
      chosenBg
    );
    res.json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOpportunities = async (req, res) => {
  try {
    const opportunities = await opportunityModel.getOpportunities(req.userId);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// apply lamaran pekerjaan asisten / lowongan
const applyOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, coverLetter } = req.body;
    const success = await opportunityModel.applyForOpportunity(req.userId, id, studentId, coverLetter);
    res.json({ success, message: success ? 'Lamaran berhasil dikirim!' : 'Gagal mengirimkan lamaran.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOpportunity, getOpportunities, applyOpportunity };

