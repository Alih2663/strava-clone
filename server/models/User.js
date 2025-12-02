const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },

    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true
    },

    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
