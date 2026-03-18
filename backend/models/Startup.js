const mongoose = require('mongoose');

const StartupSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic startup info
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  founder_names: [{ type: String, trim: true }],
  
  // Team & Market
  team_experience_rating: { type: Number, min: 1, max: 10, default: 5 },
  market_size_estimate_usd: { type: Number, min: 0 },
  revenue_model: { 
    type: String, 
    enum: ['SaaS', 'Marketplace', 'Ad', 'Subscription', 'Transaction fee', 'Other'],
    default: 'SaaS'
  },
  
  // Financials
  monthly_revenue: { type: Number, min: 0, default: 0 },
  monthly_burn: { type: Number, min: 0, default: 0 },
  cac: { type: Number, min: 0 },
  ltv: { type: Number, min: 0 },
  competition_level: { type: Number, min: 1, max: 10, default: 5 },
  runway_months: { type: Number, min: 0 },
  expected_monthly_growth_pct: { type: Number, min: 0, default: 5 },
  
  // Analysis results
  result: {
    score: { type: Number, min: 0, max: 100 },
    verdict: { type: String, enum: ['viable', 'caution', 'risky'] },
    suggestions: [String],
    projection: {
      monthly: [{
        month: Number,
        revenue: Number,
        burn: Number,
        profit: Number
      }],
      breakEvenMonth: Number
    },
    openai_analysis: String,
    components: {
      market: Number,
      unit: Number,
      runway: Number,
      comp: Number,
      team: Number
    }
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
StartupSchema.index({ user: 1, createdAt: -1 });
StartupSchema.index({ 'result.score': -1 });

module.exports = mongoose.model('Startup', StartupSchema);