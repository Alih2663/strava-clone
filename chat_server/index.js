require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const setupSocket = require('./socket');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    next();
};

app.get('/api/conversations/:userId', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const conversations = await Conversation.find({ participants: req.params.userId })
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
            const convObj = conv.toObject();

            const participantData = conv.participantsData?.find(
                p => p.userId.toString() === req.params.userId
            );

            const lastReadAt = participantData ? participantData.lastReadAt : new Date(0);

            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                createdAt: { $gt: lastReadAt },
                sender: { $ne: req.params.userId }
            });

            convObj.unreadCount = unreadCount;
            return convObj;
        }));

        res.json(conversationsWithUnread);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/conversations/:conversationId/read', authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.headers.authorization;
        const userIdFromBody = req.body.userId;

        if (!userIdFromBody) return res.status(400).json({ error: 'UserId required' });

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const existingEntryIndex = conversation.participantsData.findIndex(
            p => p.userId.toString() === userIdFromBody
        );

        if (existingEntryIndex > -1) {
            conversation.participantsData[existingEntryIndex].lastReadAt = new Date();
        } else {
            conversation.participantsData.push({
                userId: userIdFromBody,
                lastReadAt: new Date()
            });
        }


        await conversation.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/:conversationId', authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        if (page === 1) {
            const cachedMessages = await redisClient.get(`messages:${conversationId}`);
            if (cachedMessages) {
                return res.json(JSON.parse(cachedMessages));
            }
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const reversedMessages = messages.reverse();

        if (page === 1) {
            await redisClient.setEx(`messages:${conversationId}`, 60, JSON.stringify(reversedMessages));
        }

        res.json(reversedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('Chat Service Running');
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();

        const io = setupSocket(server);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
