const express = require('express');
const router = express.Router();
const investorAnalyticsController = require('../controllers/investorAnalyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Debug log to check what's being imported
console.log('Investor Analytics Controller:', {
  getInvestorPortfolio: typeof investorAnalyticsController.getInvestorPortfolio,
  getInvestmentTrends: typeof investorAnalyticsController.getInvestmentTrends,
  getStartupBreakdown: typeof investorAnalyticsController.getStartupBreakdown,
  getPerformanceMetrics: typeof investorAnalyticsController.getPerformanceMetrics
});

// All routes are protected
router.use(protect);

// Only investors can access their analytics
router.use(authorize('investor'));

// Get complete investor portfolio
router.get('/:investorId/portfolio', investorAnalyticsController.getInvestorPortfolio);

// Get investment trends
router.get('/:investorId/trends', investorAnalyticsController.getInvestmentTrends);

// Get startup-wise breakdown
router.get('/:investorId/startups', investorAnalyticsController.getStartupBreakdown);

// Get performance metrics
router.get('/:investorId/metrics', investorAnalyticsController.getPerformanceMetrics);

module.exports = router;