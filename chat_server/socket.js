const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient, redisSubClient } = require('./config/redis');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  if (process.env.NODE_ENV !== 'test') {
    io.adapter(createAdapter(redisClient, redisSubClient));
  }

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("invalid username"));
    }
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    socket.join(socket.userId);

    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.some(p => p.toString() === socket.userId)) {
          socket.join(conversationId);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        } else {
          socket.emit('error', 'Access denied to conversation');
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to join conversation');
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, text, recipientId }) => {
      try {
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else if (recipientId) {
          conversation = await Conversation.findOne({
            participants: { $all: [socket.userId, recipientId], $size: 2 }
          });

          if (!conversation) {
            conversation = await Conversation.create({
              participants: [socket.userId, recipientId],
              participantsData: [
                { userId: socket.userId, lastReadAt: new Date() },
                { userId: recipientId, lastReadAt: new Date() }
              ]
            });
          }
        } else {
          return socket.emit('error', 'Recipient or Conversation ID required');
        }

        if (!conversation) return socket.emit('error', 'Conversation not found');

        if (!conversation.participants.some(p => p.toString() === socket.userId)) {
          return socket.emit('error', 'Access denied to conversation');
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender: socket.userId,
          text: text,
        });

        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();

        io.to(conversation._id.toString()).emit('receive_message', message);

        const senderSocket = io.sockets.sockets.get(socket.id);
        if (senderSocket) {
          senderSocket.join(conversation._id.toString());
        }

        try {
          await redisClient.del(`messages:${conversation._id.toString()}`);
        } catch (redisErr) {
          console.error('Redis cache invalidation error:', redisErr);
        }

        const recipients = conversation.participants.filter(p => p.toString() !== socket.userId.toString());

        recipients.forEach(recipient => {
          socket.to(recipient.toString()).emit('message_notification', {
            conversationId: conversation._id,
            sender: socket.userId,
            text: text
          });
        });

      } catch (err) {
        console.error(err);
        socket.emit('error', 'Message could not be sent');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = setupSocket;
