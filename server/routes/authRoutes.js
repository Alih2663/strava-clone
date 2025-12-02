const express = require('express');
const { registerUser, loginUser, verifyEmail } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', require('../controllers/authController').googleLogin);
router.get('/verify', verifyEmail);

module.exports = router;
