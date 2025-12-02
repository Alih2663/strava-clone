const User = require('../models/User');

// Search users by username
const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.q
            ? {
                username: {
                    $regex: req.query.q,
                    $options: 'i',
                },
            }
            : {};

        // Get current user to check relationships
        const currentUser = await User.findById(req.user._id);

        // Find users excluding current user
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password');

        // Add status field
        const usersWithStatus = users.map(user => {
            let status = 'none';
            if (currentUser.friends.includes(user._id)) {
                status = 'friend';
            } else if (user.friendRequests.includes(currentUser._id)) {
                status = 'sent';
            } else if (currentUser.friendRequests.includes(user._id)) {
                status = 'received';
            }
            return { ...user.toObject(), status };
        });

        res.json(usersWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { getIO, getUserSocket } = require('../utils/socket');

// Send friend request
const sendFriendRequest = async (req, res) => {
    try {
        const userToFriend = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFriend) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToFriend.friendRequests.includes(req.user._id)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        if (userToFriend.friends.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already friends' });
        }

        userToFriend.friendRequests.push(req.user._id);
        await userToFriend.save();

        // Emit friend request event
        const io = getIO();
        const recipientSocketId = getUserSocket(userToFriend._id.toString());
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friend_request', {
                _id: currentUser._id,
                username: currentUser.username,
                avatar: currentUser.avatar
            });
        }

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get friend requests
const getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests', 'username avatar');
        res.json(user.friendRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept friend request
const acceptFriendRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const requester = await User.findById(req.params.id);

        if (!requester) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.friendRequests.includes(req.params.id)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        // Add to friends list for both
        user.friends.push(requester._id);
        requester.friends.push(user._id);

        // Remove from requests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);

        await user.save();
        await requester.save();

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject friend request
const rejectFriendRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.friendRequests.includes(req.params.id)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);
        await user.save();

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.bio = req.body.bio || user.bio;
            if (req.file) {
                user.avatar = `http://localhost:5000/${req.file.path}`;
            } else if (req.body.avatar) {
                user.avatar = req.body.avatar;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                token: req.token // Keep existing token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { searchUsers, sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getUserById, updateProfile };
