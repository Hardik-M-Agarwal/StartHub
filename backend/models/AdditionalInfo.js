const mongoose = require('mongoose');

const additionalInfoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['investor', 'startup', 'admin']
  },
  
  // Common fields
  location: String,
  foundedYear: Number,
  linkedinProfile: String,
  twitterProfile: String,
  website: String,
  description: String,
  
  // Startup fields
  businessStage: {
    type: String,
    enum: ['idea', 'prototype', 'mvp', 'early-revenue', 'scaling', 'established']
  },
  fundingStage: {
    type: String,
    enum: ['bootstrapped', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c-plus']
  },
  teamSize: Number,
  industry: {
    type: String,
    enum: ['technology', 'healthcare', 'fintech', 'ecommerce', 'saas', 'ai-ml', 'clean-tech', 'biotech', 'edtech', 'real-estate-tech']
  },
  businessModel: {
    type: String,
    enum: ['b2b', 'b2c', 'b2b2c', 'marketplace', 'subscription', 'transactional', 'freemium', 'enterprise-sales']
  },
  targetMarket: String,
  
  // Startup Financial Information
  revenue: Number,
  monthlyBurnRate: Number,
  runway: Number,
  customerCount: Number,
  mrr: Number, // Monthly Recurring Revenue
  
  // Startup Product & Market
  keyMetrics: String,
  competitiveAdvantage: String,
  businessChallenges: String,
  
  // Startup Future Plans
  growthStrategy: String,
  fundingNeeds: Number,
  exitStrategy: {
    type: String,
    enum: ['ipo', 'acquisition', 'long-term-independence', 'merger', 'undecided']
  },
  
  // Investor fields
  investmentFocus: [{
    type: String,
    enum: ['technology', 'healthcare', 'fintech', 'ai-ml', 'clean-tech', 'ecommerce', 'saas', 'biotech', 'edtech', 'hardware', 'consumer-goods', 'enterprise-software']
  }],
  investmentStage: {
    type: String,
    enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c-plus', 'growth', 'late-stage']
  },
  checkSize: Number,
  minInvestment: Number,
  maxInvestment: Number,
  portfolioSize: Number,
  totalAum: Number, // Assets Under Management
  yearsInvesting: Number,
  avgRoundSize: Number,
  typicalOwnership: String,
  
  // Investor Philosophy & Process
  investmentPhilosophy: String,
  dueDiligenceProcess: String,
  valueAdd: String,
  investmentCriteria: String,
  
  // Investor Preferences
  boardSeat: Boolean,
  leadInvestor: Boolean,
  geographicFocus: [{
    type: String,
    enum: ['north-america', 'europe', 'asia-pacific', 'latin-america', 'middle-east', 'africa', 'global']
  }],
  preferredIndustries: [String], // More flexible than enum for detailed interests
  excludedIndustries: [String],
  
  // Investor Deal Flow & Co-investment
  dealFlowSource: [{
    type: String,
    enum: ['referrals', 'cold-outreach', 'events', 'accelerators', 'other-vcs', 'founder-network', 'online-platforms']
  }],
  coInvestors: String,
  
  // Profile completion and metadata
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  isVerified: {
    type: Boolean,
    default: false
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'private', 'connections-only'],
    default: 'public'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted display names
additionalInfoSchema.virtual('displayBusinessStage').get(function() {
  if (!this.businessStage) return '';
  return this.businessStage.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
});

additionalInfoSchema.virtual('displayFundingStage').get(function() {
  if (!this.fundingStage) return '';
  return this.fundingStage.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
});

// Index for better query performance
additionalInfoSchema.index({ userId: 1, role: 1 });
additionalInfoSchema.index({ role: 1, businessStage: 1 });
additionalInfoSchema.index({ role: 1, investmentStage: 1 });
additionalInfoSchema.index({ 'investmentFocus': 1 });
additionalInfoSchema.index({ profileCompletion: -1 });

// Middleware to calculate profile completion before saving
additionalInfoSchema.pre('save', function(next) {
  this.profileCompletion = calculateProfileCompletion(this);
  this.lastUpdated = new Date();
  next();
});

// Static method to find by userId
additionalInfoSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to find startups by criteria
additionalInfoSchema.statics.findStartups = function(criteria = {}) {
  return this.find({ role: 'startup', ...criteria });
};

// Static method to find investors by criteria
additionalInfoSchema.statics.findInvestors = function(criteria = {}) {
  return this.find({ role: 'investor', ...criteria });
};

// Helper function to calculate profile completion
function calculateProfileCompletion(doc) {
  const requiredFields = {
    startup: [
      'businessStage', 'fundingStage', 'teamSize', 'location', 
      'industry', 'businessModel', 'targetMarket', 'description'
    ],
    investor: [
      'investmentStage', 'checkSize', 'location', 
      'investmentFocus', 'investmentPhilosophy'
    ]
  };

  const fields = requiredFields[doc.role] || [];
  let completed = 0;

  fields.forEach(field => {
    const value = doc[field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) completed++;
      } else {
        completed++;
      }
    }
  });

  return Math.round((completed / fields.length) * 100);
}

module.exports = mongoose.model('AdditionalInfo', additionalInfoSchema);