const liveService = require('../services/liveService');

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinLive', async ({ sessionId, userId }) => {
      socket.join(sessionId);
      socket.liveSessionId = sessionId;

      try {
        const session = await liveService.joinLiveSession(sessionId, userId);
        io.to(sessionId).emit('viewer:update', { sessionId, event: 'joined', viewers: session.viewers });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('leaveLive', async ({ sessionId }) => {
      if (!sessionId) return;
      try {
        const session = await liveService.leaveLiveSession(sessionId);
        io.to(sessionId).emit('viewer:update', { sessionId, event: 'left', viewers: session ? session.viewers : 0 });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('sendGift', async (payload) => {
      try {
        const gift = {
          senderId: payload.userId,
          senderName: payload.senderName,
          giftType: payload.giftType,
          label: payload.label,
          amount: payload.amount,
          createdAt: new Date().toISOString()
        };

        await liveService.addGiftToSession(payload.sessionId, gift);
        io.to(payload.sessionId).emit('liveGift', { ...gift, sessionId: payload.sessionId, senderId: payload.userId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('liveMessage', (payload) => {
      io.to(payload.sessionId).emit('liveMessage', payload);
    });

    socket.on('disconnect', async () => {
      if (!socket.liveSessionId) return;
      try {
        const session = await liveService.leaveLiveSession(socket.liveSessionId);
        io.to(socket.liveSessionId).emit('viewer:update', { sessionId: socket.liveSessionId, event: 'left', viewers: session ? session.viewers : 0 });
      } catch (error) {
        // ignore disconnect errors
      }
    });
  });
};
