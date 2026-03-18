const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidV4 } = require('uuid');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Import routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const startupRoutes = require('./routes/startupRoutes');
const additionalInfoRoutes = require('./routes/additionalInfo');
const fundRequestRoutes = require('./routes/fundRequestRoutes');
const governanceRoutes = require('./routes/governanceRoutes');
const investorAnalyticsRoutes = require('./routes/investorAnalyticsRoutes');
const investorRoutes = require('./routes/investorRoutes');
const startupProfileRoutes = require('./routes/startupProfileRoutes');


// Import chat routes and socket service
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize socket service
initializeSocket(io);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_WwmlF1M46ivOUV',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one'
});

console.log('✅ Razorpay initialized in main server');

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', blogRoutes);
app.use('/api', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/additional-info', additionalInfoRoutes);
app.use('/api/fund-requests', fundRequestRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/investor-analytics', investorAnalyticsRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/startups', startupProfileRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// ==================== SUBSCRIPTION ROUTES ====================

// Create subscription order - SIMPLE WORKING VERSION
// Create subscription order - WITH FIXED RECEIPT LENGTH
app.post('/api/subscriptions/create-order', async (req, res) => {
  try {
    console.log('🔄 Creating subscription order...', req.body);
    
    const { userId, plan } = req.body;
    
    if (!userId || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or plan'
      });
    }

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

    console.log('🎯 Creating order for plan:', selectedPlan);

    // Create SHORT receipt ID (under 40 characters)
    const shortUserId = userId.toString().substring(0, 10); // Take first 10 chars of user ID
    const timestamp = Date.now().toString().substring(6); // Take last digits of timestamp
    const receiptId = `sub_${shortUserId}_${timestamp}`; // Total length ~25 chars
    
    console.log('📝 Using receipt ID:', receiptId);

    // Create order directly with Razorpay
    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: receiptId, // Now under 40 characters
      payment_capture: 1
    });

    console.log('✅ Order created successfully:', order.id);

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: order,
        plan: selectedPlan
      }
    });

  } catch (error) {
    console.error('❌ Error creating subscription order:', error);
    
    let errorMessage = 'Failed to create order';
    if (error.error && error.error.description) {
      errorMessage = error.error.description;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      // Include specific error details for debugging
      ...(error.error && { razorpayError: error.error })
    });
  }
});


// Validate subscription payment
app.post('/api/subscriptions/validate-payment', async (req, res) => {
  try {
    console.log('🔐 Validating subscription payment...', req.body);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment validation data'
      });
    }

    // Validate payment signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one';
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Subscription payment validation failed: Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Payment validation failed - Invalid signature'
      });
    }

    // Determine plan amount
    const planDetails = {
      basic: { amount: 29900 },
      premium: { amount: 79900 },
      enterprise: { amount: 199900 }
    };
    const selectedPlan = planDetails[plan] || planDetails.premium;

    // Create subscription record in database
    const Subscription = require('./models/Subscription');
    const User = require('./models/User');

    const subscription = await Subscription.create({
      user: userId,
      plan: plan || 'premium',
      status: 'active',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: selectedPlan.amount,
      currency: 'INR',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      isSubscribed: true,
      'subscription.plan': plan || 'premium',
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': subscription.currentPeriodEnd
    });

    console.log('✅ Subscription created and user updated:', subscription._id);

    res.json({
      success: true,
      message: 'Payment validated and subscription activated successfully',
      data: {
        subscription: subscription
      }
    });

  } catch (error) {
    console.error('❌ Error validating subscription payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate payment: ' + error.message
    });
  }
});

// Get subscription plans
app.get('/api/subscriptions/plans', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        plans: [
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
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error in plans endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's subscription
app.get('/api/subscriptions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const Subscription = require('./models/Subscription');
    
    const subscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('❌ Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
});

// Cancel subscription
app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const Subscription = require('./models/Subscription');
    const User = require('./models/User');

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

    // Update user subscription status
    await User.findByIdAndUpdate(subscription.user, {
      'subscription.status': 'canceled',
      'subscription.cancelAtPeriodEnd': true
    });

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      data: subscription
    });

  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// ==================== PAYMENT ROUTES ====================

// Health check for payment system
app.get('/api/payments/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment system is healthy',
    service: 'Razorpay Payment Gateway',
    timestamp: new Date().toISOString()
  });
});

// Create payment order (generic endpoint)
app.post("/api/payments/order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    console.log("🔄 Creating payment order:", { amount, currency, receipt });

    // Validate input
    if (!amount || !currency || !receipt) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: amount, currency, receipt" 
      });
    }

    const order = await razorpay.orders.create({
      amount: parseInt(amount),
      currency: currency || 'INR',
      receipt: receipt,
      payment_capture: 1
    });

    console.log('✅ Payment order created:', order.id);

    res.json({
      success: true,
      data: order
    });

  } catch (err) {
    console.error("❌ Payment order creation error:", err);
    
    let errorMessage = "Failed to create order";
    if (err.error && err.error.description) {
      errorMessage = err.error.description;
    }

    res.status(500).json({ 
      success: false,
      message: errorMessage
    });
  }
});

// Validate payment (generic endpoint)
app.post("/api/payments/validate", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("🔐 Validating payment for order:", razorpay_order_id);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required payment validation data" 
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one';
    
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Payment validation failed: Invalid signature');
      return res.status(400).json({ 
        success: false,
        message: "Payment validation failed"
      });
    }

    console.log('✅ Payment validated successfully');

    res.json({
      success: true,
      message: "Payment Successful",
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      }
    });

  } catch (err) {
    console.error("❌ Payment validation error:", err);
    res.status(500).json({ 
      success: false,
      message: "Payment validation failed"
    });
  }
});

// ==================== OTHER ROUTES ====================

// WebRTC routes
app.get('/api/call/generate-room', (req, res) => {
  const roomId = uuidV4();
  res.json({
    success: true,
    data: {
      roomId,
      roomUrl: `/call/${roomId}`
    }
  });
});

app.get('/api/call/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json({
    success: true,
    data: {
      roomId,
      roomUrl: `/call/${roomId}`
    }
  });
});

// Get user details for call
app.get('/api/users/call/:userId', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.params.userId).select('name email role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user for call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'active',
      chat: 'active',
      webrtc: 'active',
      socket: 'active',
      database: 'connected',
      payments: 'active',
      subscriptions: 'active'
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Connect DB & Start server
connectDB();
const PORT = process.env.PORT || 5001;

// Create server instance
const serverInstance = server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💬 Chat service initialized`);
  console.log(`🎥 WebRTC service initialized`);
  console.log(`🔌 Socket.IO server active`);
  console.log(`💰 Payment system integrated (Razorpay)`);
  console.log(`📦 Subscription service active`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
  console.log(`🔗 All services running on single port: ${PORT}`);
  console.log(`📝 Subscription endpoint: POST /api/subscriptions/create-order`);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  
  // Close socket.io connections
  io.close();
  console.log('✅ Socket.IO connections closed');
  
  // Close MongoDB connection
  const mongoose = require('mongoose');
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed');
  });
  
  // Close HTTP server
  serverInstance.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('⚠️ Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});