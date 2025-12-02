const express = require('express');
const multer = require('multer');
const { uploadActivity, getFeed, getActivityById, getActivitiesByUserId } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', protect, upload.single('file'), uploadActivity);
router.get('/feed', protect, getFeed);
router.get('/user/:userId', protect, getActivitiesByUserId);
router.get('/:id', protect, getActivityById);

module.exports = router;
