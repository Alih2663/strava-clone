let io;
const userSocketMap = new Map();

const initSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: [
    process.env.CLIENT_URL, 
    "http://localhost:3001", 
    `http://${process.env.PUBLIC_IP}:3001`
].filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('join', (userId) => {
            if (!userId) return;
            const set = userSocketMap.get(userId) || new Set();
            set.add(socket.id);
            userSocketMap.set(userId, set);
            console.log(`User ${userId} mapped to sockets`, Array.from(set));
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
            for (const [userId, set] of userSocketMap.entries()) {
                if (set.has(socket.id)) {
                    set.delete(socket.id);
                    if (set.size === 0) userSocketMap.delete(userId);
                    else userSocketMap.set(userId, set);
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

const getUserSockets = (userId) => {
    const set = userSocketMap.get(userId);
    return set ? Array.from(set) : undefined;
};

const getUserSocket = (userId) => {
    return userSocketMap[userId];
};

module.exports = { initSocket, getIO, getUserSocket };
