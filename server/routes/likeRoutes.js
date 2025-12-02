const express = require('express');
const { toggleLike } = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:activityId', protect, toggleLike);

module.exports = router;
