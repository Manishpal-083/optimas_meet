const express = require('express');
const router = express.Router();
const { createMeeting, validateMeeting } = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');

// All meeting routes are protected
router.post('/create', protect, createMeeting);
router.get('/validate/:roomId', protect, validateMeeting);

module.exports = router;
