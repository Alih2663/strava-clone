const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },

    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }
}, { timestamps: true });

CommentSchema.index({ activity: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);