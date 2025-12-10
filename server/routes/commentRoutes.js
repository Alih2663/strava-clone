const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/activities/:activityId/comments', commentsController.getCommentsByActivityId);

router.post('/activities/:activityId/comments', protect, commentsController.addComment);


module.exports = router;