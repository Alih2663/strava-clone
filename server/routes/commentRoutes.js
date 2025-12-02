const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// 1. Ottenere tutti i commenti per un'attività
router.get('/activities/:activityId/comments', commentsController.getCommentsByActivityId);

// 2. Aggiungere un nuovo commento (richiede login)
router.post('/activities/:activityId/comments', protect, commentsController.addComment);

// 3. Eliminare un commento specifico (richiede login e autorizzazione)
// router.delete('/comments/:commentId', protect, commentsController.deleteComment);

module.exports = router;