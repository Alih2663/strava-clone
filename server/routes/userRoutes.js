const express = require('express');
const {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    getFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    getUserById,
    updateProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.get('/search', protect, searchUsers);
router.get('/friends', protect, getFriends);
router.get('/friend-requests', protect, getFriendRequests);
router.post('/friend-request/:id', protect, sendFriendRequest);
router.put('/friend-request/:id/accept', protect, acceptFriendRequest);
router.put('/friend-request/:id/reject', protect, rejectFriendRequest);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;
