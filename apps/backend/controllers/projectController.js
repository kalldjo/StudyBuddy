const projectModel = require('../models/projectModel');
const crypto = require('crypto');

const createProject = async (req, res) => {
  try {
    const { title, description, imageUrl, demoUrl, skills } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const id = crypto.randomUUID();
    
    // Parse skills if they come as string or array
    let skillsArray = [];
    if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(skills)) {
      skillsArray = skills;
    }

    const project = await projectModel.createProject(req.userId, id, title, description, imageUrl || '', demoUrl || '', skillsArray);
    res.status(201).json({ data: project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await projectModel.getProjects();
    res.json({ data: projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await projectModel.getUserProjects(userId);
    res.json({ data: projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await projectModel.deleteProject(req.userId, id);
    if (deleted) {
      res.json({ success: true, message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ error: 'Project not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createProject, getProjects, getUserProjects, deleteProject };
