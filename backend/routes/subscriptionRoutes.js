// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPlans,
  createOrder,
  validatePayment,
  getUserSubscription,
  cancelSubscription
} = require('../controllers/subscriptionController');

// Get all subscription plans
router.get('/plans', getPlans);

// Create Razorpay order for subscription
router.post('/create-order', createOrder);

// Validate payment and activate subscription
router.post('/validate-payment', validatePayment);

// Get user's current subscription
router.get('/user/:userId', getUserSubscription);

// Cancel subscription
router.post('/cancel', cancelSubscription);

module.exports = router;