const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Strava-like API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
