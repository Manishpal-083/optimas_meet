const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const meetingRoutes = require('./meeting.routes');

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Optimas Meet API Gateway'
  });
});

// Mounting Sub-routers
router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);

module.exports = router;
