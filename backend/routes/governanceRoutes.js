const express = require('express');
const router = express.Router();
const governanceController = require('../controllers/governanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

// Only startups can access governance data (they can only view their own data)
router.use(authorize('startup'));

// Get all investors for a specific startup with breakdown
router.get('/startup/:startupId/investors', governanceController.getStartupInvestors);

// Get investment statistics for a startup
router.get('/startup/:startupId/statistics', governanceController.getInvestmentStatistics);

// Get funding requests timeline
router.get('/startup/:startupId/timeline', governanceController.getFundingTimeline);

// Get investor concentration analysis
router.get('/startup/:startupId/concentration', governanceController.getInvestorConcentration);

module.exports = router;