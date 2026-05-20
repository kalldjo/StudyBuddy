require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const postRoutes = require('./routes/postRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const academyRoutes = require('./routes/academyRoutes');
const debugRoutes = require('./routes/debugRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const playgroundRoutes = require('./routes/playgroundRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'study-buddy-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/recommend', recommendationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/playground', playgroundRoutes);

// wrap server for socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

// share globally biar gampang diakses dari controller mana aja
global.io = io;

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`[socket] user ${userId} joined room ${userId}`);
  }
  
  socket.on('disconnect', () => {
    console.log(`[socket] socket ${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`[backend] server running on port ${PORT} with socket.io support`);
});
