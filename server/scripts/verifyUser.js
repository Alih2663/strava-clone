const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Try to load .env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyUser = async () => {
    const identifier = process.argv[2];

    if (!identifier) {
        console.error('Please provide an email or username.');
        process.exit(1);
    }

    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Try to find by email or username
        let user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            console.log(`User '${identifier}' not found. Listing all users:`);
            const users = await User.find({}, 'username email isVerified');
            console.table(users.map(u => ({
                id: u._id.toString(),
                username: u.username,
                email: u.email,
                verified: u.isVerified
            })));
            process.exit(1);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        console.log(`User ${user.username} (${user.email}) verified successfully.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

verifyUser();
