const mongoose = require('mongoose');
const LikeSchema = new mongoose.Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

LikeSchema.index({ activity: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);