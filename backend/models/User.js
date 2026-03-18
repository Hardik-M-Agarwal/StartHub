// models/User.js - Updated with password fields
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'investor', 'startup'],
    required: true
  },
  domain: {
    type: String,
    required: function() { return this.role === 'startup'; }
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'pending'],
      default: 'pending'
    },
    currentPeriodStart: {
      type: Date
    },
    currentPeriodEnd: {
      type: Date
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for checking if subscription is active
userSchema.virtual('hasActiveSubscription').get(function() {
  return this.isSubscribed && 
         this.subscription.status === 'active' && 
         (!this.subscription.currentPeriodEnd || 
          new Date(this.subscription.currentPeriodEnd) > new Date());
});

// Method to update subscription
userSchema.methods.updateSubscription = function(plan, status, periodEnd) {
  this.isSubscribed = status === 'active';
  this.subscription.plan = plan;
  this.subscription.status = status;
  if (periodEnd) {
    this.subscription.currentPeriodEnd = periodEnd;
  }
  if (status === 'active') {
    this.subscription.currentPeriodStart = new Date();
  }
  return this.save();
};

// Method to cancel subscription
userSchema.methods.cancelSubscription = function() {
  this.subscription.cancelAtPeriodEnd = true;
  this.subscription.status = 'canceled';
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);