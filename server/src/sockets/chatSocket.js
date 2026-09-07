const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', ({ userId }) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        io.emit('presence:update', Array.from(onlineUsers.keys()));
      }
    });

    socket.on('join-chat', ({ chatId }) => {
      if (chatId) {
        socket.join(chatId);
      }
    });

    socket.on('typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('typing', { chatId, userId });
    });

    socket.on('message', (message) => {
      io.to(message.chatId).emit('message', message);
    });

    socket.on('disconnect', () => {
      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('presence:update', Array.from(onlineUsers.keys()));
    });
  });
};
