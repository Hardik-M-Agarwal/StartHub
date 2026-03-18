const GrowthMetric = require('../models/GrowthMetric');
const User = require('../models/User');

// Add new metrics (Startup only)
exports.addMetrics = async (req, res) => {
  try {
    const { startupId, revenue, expenses, profit, fundingRaised, totalUsers, newUsers, churnRate, retentionRate,period } = req.body;
    const metric = new GrowthMetric({
      startupId, revenue, expenses, profit, fundingRaised, totalUsers, newUsers, churnRate, retentionRate,period,
    });
    await metric.save();
    res.status(201).json(metric);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get metrics for a specific period
exports.getMetricsByPeriod = async (req, res) => {
  try {
    const { startup_id, period } = req.params;
    const metric = await GrowthMetric.findOne({ 
      startupId: startup_id, 
      period: period 
    });
    
    if (!metric) {
      return res.status(404).json({ message: 'Metrics not found for this period' });
    }
    
    res.json(metric);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update metrics for a specific period
exports.updateMetrics = async (req, res) => {
  try {
    const { startupId, period } = req.body;
    const updateFields = { ...req.body };
    delete updateFields.startupId; // Don't update startupId
    
    const metric = await GrowthMetric.findOneAndUpdate(
      { startupId, period },
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!metric) {
      return res.status(404).json({ message: 'Metrics not found for this period' });
    }
    
    res.json(metric);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete metrics for a specific period
exports.deleteMetrics = async (req, res) => {
  try {
    const { startup_id, period } = req.params;
    const metric = await GrowthMetric.findOneAndDelete({ 
      startupId: startup_id, 
      period: period 
    });
    
    if (!metric) {
      return res.status(404).json({ message: 'Metrics not found for this period' });
    }
    
    res.json({ message: 'Metrics deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get metrics for a specific startup
exports.getStartupMetrics = async (req, res) => {
  try {
    const { startup_id } = req.params;
    const metrics = await GrowthMetric.find({ startupId: startup_id }).sort({ date: 1 });
    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get startups filtered by domain
exports.getStartupsByDomain = async (req, res) => {
  try {
    const { domain } = req.query;
    const filter = domain ? { role: 'startup', domain } : { role: 'startup' };
    const startups = await User.find(filter);
    res.status(200).json(startups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
