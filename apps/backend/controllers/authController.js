const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const authModel = require('../models/authModel');

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  bio: z.string().optional(),
  profilePicture: z.string().url('Invalid URL').optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name, bio, profilePicture } = validatedData;
    
    const existingUser = await authModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await authModel.createUser(id, email, passwordHash, name, bio || '', profilePicture || '');
    
    delete user.passwordHash;
    res.status(201).json({ data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    const user = await authModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'study-buddy-secret', { expiresIn: '1d' });
    
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    delete user.passwordHash;
    res.json({ data: { user } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie('accessToken');
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const session = require('../config/neo4j').getSession();
    const query = `
      MATCH (u:User {id: $id})
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      RETURN u {
        .*, 
        jurusan: j.name, 
        fakultas: f.name, 
        angkatan: a.year
      } AS u
    `;
    const result = await session.run(query, { id: req.userId });
    await session.close();
    
    if (!result.records.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.records[0].get('u');
    delete user.passwordHash;
    
    res.json({ data: { user } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const googleLogin = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your-google-client-id') {
    return res.redirect('http://localhost:3000/login?error=oauth_config_missing&provider=Google');
  }
  const redirectUri = 'http://localhost:3001/api/auth/google/callback';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid profile email')}`;
  res.redirect(url);
};

const googleCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('http://localhost:3000/login?error=no_code');
  }

  try {
    const redirectUri = 'http://localhost:3001/api/auth/google/callback';
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google token');
    }

    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await userinfoResponse.json();

    const email = profile.email;
    const name = profile.name || profile.given_name || 'Google Classmate';
    const profilePicture = profile.picture || '';

    if (!email) {
      throw new Error('Google email scope not returned');
    }

    let user = await authModel.getUserByEmail(email);
    if (!user) {
      const id = crypto.randomUUID();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await authModel.createUser(id, email, passwordHash, name, 'SBD Classmate via Google', profilePicture);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'study-buddy-secret', { expiresIn: '1d' });
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect('http://localhost:3000/');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(error.message)}`);
  }
};

const githubLogin = async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId || clientId === 'your-github-client-id') {
    return res.redirect('http://localhost:3000/login?error=oauth_config_missing&provider=GitHub');
  }
  const redirectUri = 'http://localhost:3001/api/auth/github/callback';
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('user:email')}`;
  res.redirect(url);
};

const githubCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('http://localhost:3000/login?error=no_code');
  }

  try {
    const redirectUri = 'http://localhost:3001/api/auth/github/callback';
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange GitHub token');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'StudyBuddy-App'
      }
    });
    const profile = await userResponse.json();

    let email = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'StudyBuddy-App'
        }
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      throw new Error('GitHub account requires a primary email');
    }

    const name = profile.name || profile.login || 'GitHub Classmate';
    const profilePicture = profile.avatar_url || '';

    let user = await authModel.getUserByEmail(email);
    if (!user) {
      const id = crypto.randomUUID();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await authModel.createUser(id, email, passwordHash, name, 'SBD Classmate via GitHub', profilePicture);
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'study-buddy-secret', { expiresIn: '1d' });
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect('http://localhost:3000/');
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(error.message)}`);
  }
};

const handleSocialBypass = async (req, res) => {
  const { provider, name, email } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    let user = await authModel.getUserByEmail(email);
    if (!user) {
      const id = crypto.randomUUID();
      const passwordHash = await bcrypt.hash('bypass-social-password-123!', 10);
      const defaultAvatar = provider === 'Google'
        ? 'https://lh3.googleusercontent.com/a/default-user'
        : 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
      user = await authModel.createUser(
        id, 
        email, 
        passwordHash, 
        name || `${provider} Scholar`, 
        `Classmate authenticated securely via ${provider} integrations.`, 
        defaultAvatar
      );
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'study-buddy-secret', { expiresIn: '1d' });
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    delete user.passwordHash;
    res.json({ data: { user } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, logout, getMe, googleLogin, googleCallback, githubLogin, githubCallback, handleSocialBypass };
