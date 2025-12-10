const Activity = require('../models/Activity');
const toGeoJSON = require('@tmcw/togeojson');
const { DOMParser } = require('@xmldom/xmldom');

const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of the earth in m
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const uploadActivity = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const gpxString = req.file.buffer.toString();
        const gpx = new DOMParser().parseFromString(gpxString, 'text/xml');
        const converted = toGeoJSON.gpx(gpx);

        const track = converted.features[0];
        if (!track || !track.geometry || track.geometry.type !== 'LineString') {
            return res.status(400).json({ message: 'Invalid GPX file' });
        }

        const coordinates = track.geometry.coordinates;

        let distance = 0;
        let elevationGain = 0;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const [lon1, lat1, ele1] = coordinates[i];
            const [lon2, lat2, ele2] = coordinates[i + 1];

            distance += getDistanceFromLatLonInM(lat1, lon1, lat2, lon2);

            if (ele2 > ele1) {
                elevationGain += (ele2 - ele1);
            }
        }

        let duration = 0;
        if (track.properties.coordTimes && track.properties.coordTimes.length > 1) {
            const startTime = new Date(track.properties.coordTimes[0]);
            const endTime = new Date(track.properties.coordTimes[track.properties.coordTimes.length - 1]);
            duration = (endTime - startTime) / 1000; // seconds
        }

        const { title, description, sportType } = req.body;

        const activity = await Activity.create({
            user: req.user._id,
            title: title || 'Untitled Activity',
            description: description || '',
            sportType: sportType || 'run',
            location: {
                type: 'LineString',
                coordinates: coordinates,
            },
            stats: {
                distance: Math.round(distance),
                duration: Math.round(duration),
                elevationGain: Math.round(elevationGain),
            },
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getFeed = async (req, res) => {
    try {
        const activities = await Activity.find().populate('user', 'username avatar').sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id).populate('user', 'username avatar');
        if (activity) {
            res.json(activity);
        } else {
            res.status(404).json({ message: 'Activity not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivitiesByUserId = async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.params.userId }).sort({ createdAt: -1 }).populate('user', 'username avatar');
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadActivity, getFeed, getActivityById, getActivitiesByUserId };
