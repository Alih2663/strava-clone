const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

dotenv.config();

connectDB();

const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./utils/socket');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api', commentRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/likes', require('./routes/likeRoutes'));

app.get('/', (req, res) => {
    res.send('Strava-like API is running');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
