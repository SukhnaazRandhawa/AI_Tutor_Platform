import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes (we'll create these next)
import authRoutes from './routes/auth';
import avatarRoutes from './routes/avatar';
import sessionRoutes from './routes/session';
import userRoutes from './routes/user';
import voiceRoutes from './routes/voice';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import database connection
import { connectDB } from './config/database';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Tutor API is running!',
    version: '1.0.0',
    status: 'active',
    features: {
      authentication: true,
      sessions: true,
      voice: true,
      avatar: true,
      ai: true
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/avatar', avatarRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });
  
  socket.on('send-message', (data) => {
    // Handle real-time messaging
    io.to(data.sessionId).emit('new-message', data);
  });

  // Voice communication events
  socket.on('voice-start', (data) => {
    console.log(`Voice session started for user ${socket.id}`);
    socket.broadcast.to(data.sessionId).emit('voice-started', {
      userId: socket.id,
      sessionId: data.sessionId
    });
  });

  socket.on('voice-data', (data) => {
    // Handle real-time voice data
    socket.broadcast.to(data.sessionId).emit('voice-received', {
      audioData: data.audioData,
      userId: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on('voice-end', (data) => {
    console.log(`Voice session ended for user ${socket.id}`);
    socket.broadcast.to(data.sessionId).emit('voice-ended', {
      userId: socket.id,
      sessionId: data.sessionId
    });
  });

  // Avatar video events
  socket.on('avatar-start', (data) => {
    console.log(`Avatar session started for user ${socket.id}`);
    socket.broadcast.to(data.sessionId).emit('avatar-started', {
      userId: socket.id,
      sessionId: data.sessionId,
      avatarConfig: data.avatarConfig
    });
  });

  socket.on('avatar-video-ready', (data) => {
    console.log(`Avatar video ready for user ${socket.id}`);
    socket.broadcast.to(data.sessionId).emit('avatar-video-available', {
      userId: socket.id,
      sessionId: data.sessionId,
      videoUrl: data.videoUrl,
      videoId: data.videoId
    });
  });

  socket.on('avatar-stream', (data) => {
    // Handle real-time avatar video streaming
    socket.broadcast.to(data.sessionId).emit('avatar-stream-received', {
      videoData: data.videoData,
      userId: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on('avatar-end', (data) => {
    console.log(`Avatar session ended for user ${socket.id}`);
    socket.broadcast.to(data.sessionId).emit('avatar-ended', {
      userId: socket.id,
      sessionId: data.sessionId
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log(`Frontend should run on ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log('Features enabled: Authentication, Sessions, Voice Processing, Avatar Generation, AI Integration');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 