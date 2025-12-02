const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.getCommentsByActivityId = async (req, res) => {
    try {
        const { activityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(activityId)) {
            return res.status(400).json({ message: 'Activity ID not valid.' });
        }

        // 1. Fetch paginated root comments (no parent)
        const rootComments = await Comment.find({ activity: activityId, parentComment: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username profilePicture');

        // 2. Fetch replies for the retrieved root comments
        const rootCommentIds = rootComments.map(c => c._id);
        const replies = await Comment.find({ activity: activityId, parentComment: { $in: rootCommentIds } })
            .sort({ createdAt: 1 })
            .populate('user', 'username profilePicture');

        // 3. Combine root comments and replies
        const comments = [...rootComments, ...replies];

        const totalRootComments = await Comment.countDocuments({ activity: activityId, parentComment: null });

        res.status(200).json({
            comments,
            totalPages: Math.ceil(totalRootComments / limit),
            currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching comments.' });
    }
};

// POST /api/activities/:activityId/comments
exports.addComment = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { text, parentComment } = req.body;
        // L'ID utente deve provenire dal middleware di autenticazione
        const userId = req.user.id;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: 'Il testo del commento è richiesto.' });
        }

        // 1. Crea il nuovo documento Commento
        const newComment = new Comment({
            activity: activityId,
            user: userId,
            text,
            parentComment: parentComment || null
        });

        await newComment.save();

        // Increment comment count
        activity.commentCount += 1;
        await activity.save();

        const populatedComment = await Comment.findById(newComment._id).populate('user', 'username profilePicture'); // Changed 'avatar' to 'profilePicture' to match existing code

        // Emit new comment event
        const io = getIO();
        io.emit(`activity_${activityId}_comments`, populatedComment);

        // Create Notification
        // 1. Notify activity owner (if not self)
        if (activity.user.toString() !== userId.toString()) {
            const notification = new Notification({
                recipient: activity.user,
                sender: userId,
                type: 'comment',
                activity: activityId,
                comment: newComment._id,
                read: false
            });
            await notification.save();

            // Emit notification
            const recipientSocketId = getUserSocket(activity.user.toString());
            if (recipientSocketId) {
                const populatedNotif = await Notification.findById(notification._id)
                    .populate('sender', 'username profilePicture')
                    .populate('activity', 'title');
                io.to(recipientSocketId).emit('notification', populatedNotif);
            }
        }

        // 2. If reply, notify parent comment author (if not self and not activity owner - avoid double notif)
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (parent && parent.user.toString() !== userId.toString() && parent.user.toString() !== activity.user.toString()) {
                const replyNotification = new Notification({
                    recipient: parent.user,
                    sender: userId,
                    type: 'reply',
                    activity: activityId,
                    comment: newComment._id,
                    read: false
                });
                await replyNotification.save();

                // Emit notification
                const recipientSocketId = getUserSocket(parent.user.toString());
                if (recipientSocketId) {
                    const populatedNotif = await Notification.findById(replyNotification._id)
                        .populate('sender', 'username profilePicture')
                        .populate('activity', 'title');
                    io.to(recipientSocketId).emit('notification', populatedNotif);
                }
            }
        }

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante l\'aggiunta del commento.' });
    }
};
