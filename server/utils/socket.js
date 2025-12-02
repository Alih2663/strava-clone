let io;
const userSocketMap = {}; // Map userId to socketId

const initSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3001",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('join', (userId) => {
            if (userId) {
                userSocketMap[userId] = socket.id;
                console.log(`User ${userId} mapped to socket ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
            // Remove user from map on disconnect
            for (const [userId, socketId] of Object.entries(userSocketMap)) {
                if (socketId === socket.id) {
                    delete userSocketMap[userId];
                    break;
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const getUserSocket = (userId) => {
    return userSocketMap[userId];
};

module.exports = { initSocket, getIO, getUserSocket };
