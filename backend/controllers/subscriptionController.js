// controllers/subscriptionController.js
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Get subscription plans
exports.getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 299,
        currency: 'INR',
        period: 'month',
        features: [
          'Access to basic startup profiles',
          'Limited messaging (50 messages/month)',
          'Basic analytics',
          'Email support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 799,
        currency: 'INR',
        period: 'month',
        features: [
          'Full startup profile access',
          'Unlimited messaging',
          'Advanced analytics & insights',
          'Priority support',
          'Video call integration',
          'Investment opportunity alerts'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 1999,
        currency: 'INR',
        period: 'month',
        features: [
          'All Premium features',
          'Dedicated account manager',
          'Custom reporting',
          'API access',
          'White-label solutions',
          '24/7 phone support',
          'Advanced security features'
        ]
      }
    ];

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
};

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { userId, plan } = req.body;

    const planDetails = {
      basic: { amount: 29900, name: 'Basic Plan' },
      premium: { amount: 79900, name: 'Premium Plan' },
      enterprise: { amount: 199900, name: 'Enterprise Plan' }
    };

    const selectedPlan = planDetails[plan];
    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // Create order in Razorpay
    const orderResponse = await fetch('http://localhost:5002/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: selectedPlan.amount,
        currency: 'INR',
        receipt: `receipt_${userId}_${Date.now()}`
      })
    });

    const order = await orderResponse.json();

    if (!order.id) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create order with payment gateway'
      });
    }

    // Create subscription record
    const subscription = await Subscription.create({
      user: userId,
      plan: plan,
      status: 'pending',
      razorpayOrderId: order.id,
      amount: selectedPlan.amount / 100, // Convert back to rupees
      currency: 'INR',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    res.json({
      success: true,
      data: {
        order: order,
        subscription: subscription,
        plan: selectedPlan
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription order'
    });
  }
};

// Validate payment and activate subscription
exports.validatePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    // Validate payment with Razorpay
    const validateResponse = await fetch('http://localhost:5002/order/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      })
    });

    const validation = await validateResponse.json();

    if (validation.msg !== 'Payment Successful') {
      return res.status(400).json({
        success: false,
        message: 'Payment validation failed'
      });
    }

    // Update subscription status
    const subscription = await Subscription.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: userId },
      {
        status: 'active',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      isSubscribed: true,
      'subscription.plan': subscription.plan,
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': subscription.currentPeriodEnd
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Error validating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate payment'
    });
  }
};

// Get user's current subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'canceled',
        cancelAtPeriodEnd: true
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update user subscription status at period end
    await User.findByIdAndUpdate(subscription.user, {
      'subscription.status': 'canceled',
      'subscription.cancelAtPeriodEnd': true
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of billing period',
      data: subscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};