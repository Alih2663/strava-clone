const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        console.log('Creating user...');
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationToken,
        });
        console.log('User created:', user._id);

        if (user) {
            console.log('Sending email...');
            try {
                await sendVerificationEmail(user.email, user.username, user.verificationToken);
                console.log('Email sent.');
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email before logging in.' });
            }
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const { OAuth2Client } = require('google-auth-library');

const googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token not provided' });
    }

    if (!process.env.CLIENT_ID) {
        console.error('CLIENT_ID not configured');
        return res.status(500).json({ message: 'Server configuration invalid' });
    }

    const client = new OAuth2Client(process.env.CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { name, email, sub: googleId, picture } = payload;

        if (!payload.email_verified) {
            return res.status(400).json({ message: 'Email not verified by Google' });
        }

        let user = await User.findOne({ email });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture || user.avatar;
                await user.save();
            }
        } else {
            let username = name.replace(/\s+/g, '').toLowerCase();

            let usernameExists = await User.findOne({ username });
            let counter = 1;
            while (usernameExists) {
                username = `${name.replace(/\s+/g, '').toLowerCase()}${counter}`;
                usernameExists = await User.findOne({ username });
                counter++;
            }

            user = await User.create({
                username,
                email,
                googleId,
                avatar: picture,
                isVerified: true,
                password: undefined,
            });
        }

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Google Login error:', error.message);

        if (error.message.includes('Token used too early')) {
            return res.status(400).json({ message: 'Token not yet valid' });
        }
        if (error.message.includes('Token used too late')) {
            return res.status(400).json({ message: 'Token expired' });
        }

        res.status(400).json({
            message: 'Google authentication failed',
            error: error.message
        });
    }
};

module.exports = { registerUser, loginUser, verifyEmail, googleLogin };

