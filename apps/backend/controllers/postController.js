const postModel = require('../models/postModel');
const crypto = require('crypto');

const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const id = crypto.randomUUID();
    const post = await postModel.createPost(req.userId, id, content, imageUrl || '');
    res.status(201).json({ data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const posts = await postModel.getFeedPosts(req.userId);
    res.json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const liked = await postModel.toggleLikePost(req.userId, id);
    res.json({ data: { liked } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await postModel.deletePost(req.userId, id);
    if (deleted) {
      res.json({ success: true, message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await postModel.getUserPosts(userId, req.userId);
    res.json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// tambah komentar ke pos
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    const comment = await postModel.addCommentToPost(req.userId, id, content);
    res.status(201).json({ data: comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get list komentar pos
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await postModel.getPostComments(id);
    res.json({ data: comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  createPost, 
  getFeed, 
  toggleLike, 
  deletePost, 
  getUserPosts,
  addComment,
  getComments
};

