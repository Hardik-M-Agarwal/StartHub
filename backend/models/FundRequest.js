const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Basic Details
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: 'INR'
    },
    fundingType: {
      type: String,
      enum: ['equity', 'debt', 'grant', 'venture_debt'],
      required: true
    },
    // For Equity - percentage offered
    equityPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    // For Debt - interest rate and tenure
    interestRate: {
      type: Number
    },
    loanTenure: {
      type: String // e.g., "24 months", "3 years"
    },
    // Description and use of funds
    description: {
      type: String,
      required: true,
      trim: true
    },
    useOfFunds: {
      type: String,
      trim: true
    },
    // Company details
    companyName: {
      type: String,
      trim: true
    },
    domain: {
      type: String,
      trim: true
    },
    yearOfEstablishment: {
      type: Number
    },
    teamSize: {
      type: Number
    },
    // Previous funding
    previousFunding: {
      type: Number,
      default: 0
    },
    // Timeline
    fundingTimeline: {
      type: String // e.g., "ASAP", "3 months", "6 months"
    },
    milestone: {
      type: String,
      trim: true
    },
    // Status and approval
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'negotiating'],
      default: 'pending'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    // Payment details
    razorpayOrderId: {
      type: String
    },
    razorpayPaymentId: {
      type: String
    },
    razorpaySignature: {
      type: String
    },
    // Timestamps
    approvedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    // Investor notes
    investorNotes: {
      type: String
    },
    // Negotiation details
    negotiationDetails: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster queries
fundRequestSchema.index({ startupId: 1, investorId: 1, createdAt: -1 });
fundRequestSchema.index({ status: 1, createdAt: -1 });
fundRequestSchema.index({ startupId: 1, status: 1 });
fundRequestSchema.index({ investorId: 1, status: 1 });

module.exports = mongoose.model('FundRequest', fundRequestSchema);
