const express = require('express');
const router = express.Router();
const startupController = require('../controllers/startupController');

// Startup analysis routes
router.post('/startups', startupController.createStartupAnalysis);
router.get('/startups/user/:userId', startupController.getUserStartups);
router.get('/startups/:id', startupController.getStartupAnalysis);
router.delete('/startups/:id', startupController.deleteStartupAnalysis);

module.exports = router;