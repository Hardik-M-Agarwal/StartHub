import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = 5002;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Razorpay instance with proper error handling
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_WwmlF1M46ivOUV',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one'
  });
  console.log('✅ Razorpay initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Razorpay Payment Gateway',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 Razorpay Payment Server running on port ${port}`);
  console.log(`🔑 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID || 'Using test key'}`);
});

// Route to create a new order
app.post("/order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    console.log("🔄 Creating Razorpay order with:", { amount, currency, receipt });

    // Validate input
    if (!amount || !currency || !receipt) {
      return res.status(400).json({ 
        message: "Missing required fields: amount, currency, receipt" 
      });
    }

    if (amount < 100) { // Minimum amount in paise
      return res.status(400).json({ 
        message: "Amount must be at least 100 paise (₹1)" 
      });
    }

    const order = await razorpay.orders.create({
      amount: parseInt(amount),
      currency: currency || 'INR',
      receipt: receipt,
      payment_capture: 1 // Auto capture payment
    });

    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    console.log('✅ Razorpay order created:', order.id);

    res.json(order);
  } catch (err) {
    console.error("❌ Order creation error:", err);
    
    let errorMessage = "Failed to create order";
    let statusCode = 500;

    if (err.error && err.error.description) {
      errorMessage = err.error.description;
      statusCode = 400; // Bad request for Razorpay errors
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(statusCode).json({ 
      message: errorMessage, 
      error: err.error || err.message 
    });
  }
});

// Route to validate payment
app.post("/order/validate", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("🔐 Validating payment for order:", razorpay_order_id);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        msg: "Missing required payment validation data" 
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one';
    
    const sha = crypto.createHmac("sha256", key_secret);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");

    if (digest !== razorpay_signature) {
      console.error('❌ Payment validation failed: Invalid signature');
      return res.status(400).json({ 
        msg: "Transaction not legitimate!",
        details: "Signature verification failed"
      });
    }

    console.log('✅ Payment validated successfully for order:', razorpay_order_id);

    res.json({
      msg: "Payment Successful",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
  } catch (err) {
    console.error("❌ Payment validation error:", err);
    res.status(500).json({ 
      msg: "Payment validation failed", 
      error: err.message 
    });
  }
});

// Test endpoint to verify Razorpay connection
app.post("/test", async (req, res) => {
  try {
    // Try to create a small test order
    const testOrder = await razorpay.orders.create({
      amount: 100, // ₹1
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      payment_capture: 1
    });

    res.json({
      success: true,
      message: 'Razorpay connection successful',
      order: testOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Razorpay connection failed',
      error: error.message
    });
  }
});

export default app;