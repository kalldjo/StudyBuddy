const userModel = require('../models/userModel');

const updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture, fakultas, jurusan, angkatan } = req.body;
    const user = await userModel.updateProfile(req.userId, name, bio, profilePicture, fakultas, jurusan, angkatan);
    console.log('[DEBUG] updateProfile raw user result:', user);
    if (user && user.passwordHash) delete user.passwordHash;
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAcademic = async (req, res) => {
  try {
    const { fakultas, jurusan, angkatan } = req.body;
    let data = {};
    if (fakultas) data.fakultas = await userModel.updateAcademic(req.userId, 'fakultas', fakultas);
    if (jurusan) data.jurusan = await userModel.updateAcademic(req.userId, 'jurusan', jurusan);
    if (angkatan) data.angkatan = await userModel.updateAcademic(req.userId, 'angkatan', angkatan);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    await userModel.updateListRel(req.userId, 'INTERESTED_IN', 'Interest', interests);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    await userModel.updateListRel(req.userId, 'HAS_SKILL', 'Skill', skills);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = await userModel.getUserProfile(id, req.userId);
    if (!profileData) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: profileData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateProfile, updateAcademic, updateInterests, updateSkills, getUserProfile };
