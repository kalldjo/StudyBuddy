const projectModel = require("../models/projectModel");
const crypto = require("crypto");

const createProject = async (req, res) => {
  try {
    const { title, description, imageUrl, demoUrl, skills } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    const id = crypto.randomUUID();

    // Parse skills if they come as string or array
    let skillsArray = [];
    if (typeof skills === "string") {
      skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(skills)) {
      skillsArray = skills;
    }

    const project = await projectModel.createProject(req.userId, id, title, description, imageUrl || "", demoUrl || "", skillsArray);
    res.status(201).json({ data: project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, demoUrl, skills } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Parse skills if they come as string or array
    let skillsArray = [];
    if (typeof skills === "string") {
      skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(skills)) {
      skillsArray = skills;
    }

    const project = await projectModel.updateProject(req.userId, id, title, description, imageUrl || "", demoUrl || "", skillsArray);
    if (project) {
      res.json({ data: project });
    } else {
      res.status(404).json({ error: "Project not found or unauthorized" });
    }
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
      res.json({ success: true, message: "Project deleted successfully" });
    } else {
      res.status(404).json({ error: "Project not found or unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, message } = req.body;
    await projectModel.requestJoinProject(req.userId, id, role, message);
    res.json({ success: true, message: "Join request sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterId } = req.body;
    const success = await projectModel.acceptJoinProject(req.userId, id, requesterId);
    if (success) {
      res.json({ success: true, message: "Request accepted" });
    } else {
      res.status(403).json({ error: "Unauthorized or request not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterId } = req.body;
    await projectModel.rejectJoinProject(req.userId, id, requesterId);
    res.json({ success: true, message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await projectModel.getProjectRequests(req.userId);
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createProject, updateProject, getProjects, getUserProjects, deleteProject, requestJoin, acceptJoin, rejectJoin, getRequests };
