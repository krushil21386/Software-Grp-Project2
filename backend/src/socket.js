const jwt = require('jsonwebtoken');
const logger = require('./services/loggerService');

let io;

module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // ── Socket.io Authentication Middleware ────────────────────────
    // Verifies JWT from cookies or handshake auth; unauthenticated 
    // clients can still connect but are placed in a "public" room only.
    io.use((socket, next) => {
      let token = socket.handshake.auth?.token;

      // Fallback to Cookie parsing (Professional approach)
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
          const [key, val] = c.trim().split('=');
          res[key] = val;
          return res;
        }, {});
        token = cookies.accessToken;
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.userRole = decoded.role;
          logger.info(`[Socket.io] Authenticated connection: userId=${decoded.id}, role=${decoded.role}`);
        } catch (err) {
          // Token invalid/expired — allow connection but without identity
          logger.warn(`[Socket.io] Invalid token provided, connecting as guest: ${err.message}`);
          socket.userId = null;
          socket.userRole = null;
        }
      } else {
        socket.userId = null;
        socket.userRole = null;
      }
      next();
    });

    io.on('connection', (socket) => {
      // Join user-specific room for targeted events
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        logger.info(`[Socket.io] User ${socket.userId} joined room user:${socket.userId}`);
      }

      // Join role-based rooms for broadcast filtering
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      socket.on('disconnect', () => {
        if (socket.userId) {
          logger.info(`[Socket.io] User ${socket.userId} disconnected`);
        }
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
