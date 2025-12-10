const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    sportType: { type: String, enum: ['run', 'ride'], required: true },
    location: {
        type: { type: String, enum: ['LineString'], required: true },
        coordinates: { type: [[Number]], required: true },
    },
    stats: {
        distance: { type: Number, required: true },
        duration: { type: Number, required: true },
        elevationGain: { type: Number, default: 0 },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 }
}, { timestamps: true });

ActivitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Activity', ActivitySchema);
