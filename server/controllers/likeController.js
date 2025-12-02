const Like = require('../models/Like');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { getIO, getUserSocket } = require('../utils/socket');

// Toggle like on an activity
const toggleLike = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user._id;

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        const existingLike = await Like.findOne({ activity: activityId, user: userId });
        const io = getIO();

        if (existingLike) {
            // Unlike
            await Like.findByIdAndDelete(existingLike._id);
            activity.likes = activity.likes.filter(id => id.toString() !== userId.toString());
            await activity.save();

            // Emit update to everyone viewing the activity
            io.emit(`activity_${activityId}_likes`, { count: activity.likes.length, likes: activity.likes });

            res.json({ message: 'Unliked', liked: false, count: activity.likes.length });
        } else {
            // Like
            const newLike = new Like({
                activity: activityId,
                user: userId
            });
            await newLike.save();

            activity.likes.push(userId);
            await activity.save();

            // Emit update to everyone viewing the activity
            io.emit(`activity_${activityId}_likes`, { count: activity.likes.length, likes: activity.likes });

            // Create notification if not self-like
            if (activity.user.toString() !== userId.toString()) {
                const notification = new Notification({
                    recipient: activity.user,
                    sender: userId,
                    type: 'like',
                    activity: activityId,
                    read: false
                });
                await notification.save();

                // Emit notification to recipient
                const recipientSocketId = getUserSocket(activity.user.toString());
                if (recipientSocketId) {
                    const populatedNotification = await Notification.findById(notification._id)
                        .populate('sender', 'username profilePicture')
                        .populate('activity', 'title');
                    io.to(recipientSocketId).emit('notification', populatedNotification);
                }
            }

            res.json({ message: 'Liked', liked: true, count: activity.likes.length });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { toggleLike };
