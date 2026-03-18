const express = require('express');
const router = express.Router();
const investorProfileController = require('../controllers/investorProfileController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (no auth required for browsing)
router.get('/profile/:investorId', investorProfileController.getInvestorProfile);
router.get('/investments/:investorId', investorProfileController.getInvestorInvestments);
router.get('/portfolio/:investorId', investorProfileController.getInvestorPortfolioSummary);

// Protected routes (for investor's own data)
router.use('/my', protect);
router.use('/my', authorize('investor'));

router.get('/my/profile', (req, res) => {
  // Redirect to profile with investor's own ID
  res.redirect(`/api/investors/profile/${req.user._id}`);
});

router.get('/my/investments', (req, res) => {
  res.redirect(`/api/investors/investments/${req.user._id}`);
});

router.get('/my/portfolio', (req, res) => {
  res.redirect(`/api/investors/portfolio/${req.user._id}`);
});

module.exports = router;