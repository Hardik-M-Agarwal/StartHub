const mongoose = require('mongoose');

const growthMetricSchema = new mongoose.Schema(
  {
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    revenue: Number,
    expenses: Number,
    profit: Number,
    fundingRaised: Number,
    totalUsers: Number,
    newUsers: Number,
    churnRate: Number,
    retentionRate: Number,
    date: { type: Date, default: Date.now },
    period: {
  type: String,
  required: true, 
},
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrowthMetric', growthMetricSchema);
