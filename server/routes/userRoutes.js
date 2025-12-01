const express = require('express');
const {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/friend-requests', protect, getFriendRequests);
router.post('/friend-request/:id', protect, sendFriendRequest);
router.put('/friend-request/:id/accept', protect, acceptFriendRequest);
router.put('/friend-request/:id/reject', protect, rejectFriendRequest);

module.exports = router;
