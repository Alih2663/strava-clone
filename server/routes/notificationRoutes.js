const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, notificationController.getNotifications);
router.put('/read', protect, notificationController.markAsRead);
router.put('/:id/read', protect, notificationController.markNotificationRead);

module.exports = router;
