const mongoose = require('mongoose');
const FundRequest = require('../models/FundRequest');
const Message = require('../models/Message');
const User = require('../models/User');

// Create a new fund request (ONLY FOR STARTUPS)
exports.createFundRequest = async (req, res) => {
  try {
    const { 
      startupId, investorId, amount, fundingType, description, 
      equityPercentage, interestRate, loanTenure,
      useOfFunds, companyName, domain, yearOfEstablishment, teamSize,
      previousFunding, fundingTimeline, milestone,
      currentUserId
    } = req.body;

    if (!startupId || !investorId || !amount || !fundingType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if current user is making request for themselves
    if (currentUserId && currentUserId !== startupId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create fund requests for yourself'
      });
    }

    // Validate user IDs and roles
    const [startup, investor] = await Promise.all([
      User.findById(startupId),
      User.findById(investorId)
    ]);

    if (!startup || !investor) {
      return res.status(404).json({
        success: false,
        message: 'Startup or Investor not found'
      });
    }

    // Validate that startup is a startup
    if (startup.role !== 'startup') {
      return res.status(403).json({
        success: false,
        message: 'Only startups can create fund requests'
      });
    }

    // Validate that targetted user is an investor
    if (investor.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'Fund requests can only be sent to investors'
      });
    }

    // Create fund request with all fields
    const fundRequest = new FundRequest({
      startupId,
      investorId,
      amount,
      fundingType,
      description,
      equityPercentage: fundingType === 'equity' ? equityPercentage : null,
      interestRate: fundingType === 'debt' ? interestRate : null,
      loanTenure: fundingType === 'debt' ? loanTenure : null,
      useOfFunds,
      companyName,
      domain,
      yearOfEstablishment,
      teamSize,
      previousFunding: previousFunding || 0,
      fundingTimeline,
      milestone,
      status: 'pending'
    });

    await fundRequest.save();

    console.log('✅ Fund request created:', fundRequest._id);

    res.status(201).json({
      success: true,
      message: 'Fund request created successfully',
      data: fundRequest
    });
  } catch (error) {
    console.error('❌ Error creating fund request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fund request: ' + error.message
    });
  }
};

// Get fund requests for a user
exports.getFundRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, role } = req.query;

    const filterObj = {
      $or: [
        { startupId: userId },
        { investorId: userId }
      ]
    };

    if (status) {
      filterObj.status = status;
    }

    const fundRequests = await FundRequest.find(filterObj)
      .populate('startupId', 'name email role')
      .populate('investorId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: fundRequests
    });
  } catch (error) {
    console.error('❌ Error fetching fund requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fund requests: ' + error.message
    });
  }
};

// Get a specific fund request
exports.getFundRequest = async (req, res) => {
  try {
    const { fundRequestId } = req.params;

    const fundRequest = await FundRequest.findById(fundRequestId)
      .populate('startupId', 'name email role domain')
      .populate('investorId', 'name email role')
      .populate('messageId');

    if (!fundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fund request not found'
      });
    }

    res.json({
      success: true,
      data: fundRequest
    });
  } catch (error) {
    console.error('❌ Error fetching fund request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fund request: ' + error.message
    });
  }
};

// Approve a fund request (ONLY FOR INVESTORS)
exports.approveFundRequest = async (req, res) => {
  try {
    const { fundRequestId } = req.params;
    const { currentUserId } = req.body;

    const fundRequest = await FundRequest.findById(fundRequestId)
      .populate('investorId', 'role _id');

    if (!fundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fund request not found'
      });
    }

    // Verify the current user is the investor receiving the request
    if (!currentUserId || currentUserId !== fundRequest.investorId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the receiving investor can approve this fund request'
      });
    }

    // Verify investor role
    if (fundRequest.investorId.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'Only investors can approve fund requests'
      });
    }

    // Can only approve pending requests
    if (fundRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${fundRequest.status} fund request`
      });
    }

    fundRequest.status = 'approved';
    fundRequest.approvedAt = new Date();
    await fundRequest.save();

    console.log('✅ Fund request approved:', fundRequest._id);

    res.json({
      success: true,
      message: 'Fund request approved successfully',
      data: fundRequest
    });
  } catch (error) {
    console.error('❌ Error approving fund request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve fund request: ' + error.message
    });
  }
};

// Reject a fund request (ONLY FOR INVESTORS)
exports.rejectFundRequest = async (req, res) => {
  try {
    const { fundRequestId } = req.params;
    const { rejectionReason, currentUserId } = req.body;

    const fundRequest = await FundRequest.findById(fundRequestId)
      .populate('investorId', 'role _id');

    if (!fundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fund request not found'
      });
    }

    // Verify the current user is the investor receiving the request
    if (!currentUserId || currentUserId !== fundRequest.investorId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the receiving investor can reject this fund request'
      });
    }

    // Verify investor role
    if (fundRequest.investorId.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'Only investors can reject fund requests'
      });
    }

    // Can only reject pending requests
    if (fundRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${fundRequest.status} fund request`
      });
    }

    fundRequest.status = 'rejected';
    fundRequest.rejectedAt = new Date();
    fundRequest.rejectionReason = rejectionReason || '';
    await fundRequest.save();

    console.log('✅ Fund request rejected:', fundRequest._id);

    res.json({
      success: true,
      message: 'Fund request rejected successfully',
      data: fundRequest
    });
  } catch (error) {
    console.error('❌ Error rejecting fund request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject fund request: ' + error.message
    });
  }
};

// Process payment for approved fund request (ONLY FOR STARTUPS)
exports.processFundRequestPayment = async (req, res) => {
  try {
    const { fundRequestId, razorpay_order_id, razorpay_payment_id, razorpay_signature, currentUserId } = req.body;

    if (!fundRequestId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields'
      });
    }

    // Validate payment signature
    const crypto = require('crypto');
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret_need_real_one';
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Fund request payment validation failed: Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Payment validation failed'
      });
    }

    const fundRequest = await FundRequest.findById(fundRequestId)
      .populate('investorId', 'role _id');

    if (!fundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fund request not found'
      });
    }

    // Verify the current user is the investor that approved
    if (!currentUserId || currentUserId !== fundRequest.investorId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the approving investor can process the fund transfer'
      });
    }

    // Verify investor role
    if (fundRequest.investorId.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'Invalid investor role for fund transfer'
      });
    }

    // Can only process payment for approved requests
    if (fundRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Fund request must be approved before processing payment'
      });
    }

    // Update fund request with payment details
    fundRequest.status = 'completed';
    fundRequest.razorpayOrderId = razorpay_order_id;
    fundRequest.razorpayPaymentId = razorpay_payment_id;
    fundRequest.razorpaySignature = razorpay_signature;
    fundRequest.completedAt = new Date();
    
    await fundRequest.save();

    console.log('✅ Fund transfer payment processed:', fundRequest._id);

    res.json({
      success: true,
      message: 'Payment processed and fund request completed successfully',
      data: fundRequest
    });
  } catch (error) {
    console.error('❌ Error processing fund request payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment: ' + error.message
    });
  }
};

// Send fund request as message
exports.sendFundRequestMessage = async (req, res) => {
  try {
    const { fundRequestId, senderId, receiverId } = req.body;

    if (!fundRequestId || !senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const fundRequest = await FundRequest.findById(fundRequestId);

    if (!fundRequest) {
      return res.status(404).json({
        success: false,
        message: 'Fund request not found'
      });
    }

    // Create a message for the fund request
    const message = new Message({
      senderId,
      receiverId,
      content: `Fund Request: ${fundRequest.fundingType.toUpperCase()} | Amount: ₹${fundRequest.amount} | ${fundRequest.description}`,
      messageType: 'fund_request',
      fundRequestId
    });

    await message.save();

    // Update fund request with message ID
    fundRequest.messageId = message._id;
    await fundRequest.save();

    console.log('✅ Fund request message created:', message._id);

    res.status(201).json({
      success: true,
      message: 'Fund request sent as message successfully',
      data: {
        message: message,
        fundRequest: fundRequest
      }
    });
  } catch (error) {
    console.error('❌ Error sending fund request message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send fund request: ' + error.message
    });
  }
};
