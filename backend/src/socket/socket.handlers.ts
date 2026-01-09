import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const setupSocketHandlers = (io: Server) => {
  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.id;
      socket.data.accountType = decoded.accountType;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id} (User: ${socket.data.userId})`);

    // Join user to their own room
    socket.join(socket.data.userId);

    // Handle video upload progress
    socket.on('upload:progress', (data) => {
      const { videoId, progress } = data;
      // Emit progress to the user's room
      io.to(socket.data.userId).emit('upload:progress', {
        videoId,
        progress,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  console.log('📡 Socket.IO handlers configured');
};
