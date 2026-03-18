const express = require('express');
const router = express.Router();
const startupProfileController = require('../controllers/startupProfileController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (no auth required for browsing)
router.get('/profile/:startupId', startupProfileController.getStartupProfile);
router.get('/growth/:startupId', startupProfileController.getStartupGrowthMetrics);
router.get('/funding/:startupId', startupProfileController.getStartupFundingHistory);
router.get('/funding-stats/:startupId', startupProfileController.getStartupFundingStats);
router.get('/investors/:startupId', startupProfileController.getStartupInvestors);

// Protected routes (for startup's own data)
router.use('/my', protect);
router.use('/my', authorize('startup'));

router.get('/my/profile', (req, res) => {
  res.redirect(`/api/startups/profile/${req.user._id}`);
});

router.get('/my/growth', (req, res) => {
  res.redirect(`/api/startups/growth/${req.user._id}`);
});

router.get('/my/funding', (req, res) => {
  res.redirect(`/api/startups/funding/${req.user._id}`);
});

module.exports = router;