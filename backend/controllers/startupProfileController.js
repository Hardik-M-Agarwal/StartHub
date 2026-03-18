const User = require('../models/User');
const FundRequest = require('../models/FundRequest');
const GrowthMetric = require('../models/GrowthMetric');
const mongoose = require('mongoose');

// Get startup profile with complete details and statistics
exports.getStartupProfile = async (req, res) => {
  try {
    const { startupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid startup ID' 
      });
    }

    // Get startup basic info from User model
    const startup = await User.findById(startupId).select('-password');
    
    if (!startup || startup.role !== 'startup') {
      return res.status(404).json({ 
        success: false, 
        message: 'Startup not found' 
      });
    }

    // Get growth metrics
    const growthMetrics = await getStartupGrowthMetrics(startupId);

    // Get funding statistics from FundRequest model
    const fundingStats = await calculateStartupFundingStats(startupId);

    // Get additional info (you'll need an AdditionalInfo model for this)
    const additionalInfo = await getStartupAdditionalInfo(startupId);

    res.json({
      success: true,
      data: {
        user: {
          _id: startup._id,
          name: startup.name,
          email: startup.email,
          role: startup.role,
          domain: startup.domain,
          isSubscribed: startup.isSubscribed,
          subscription: startup.subscription,
          createdAt: startup.createdAt
        },
        additionalInfo: additionalInfo || {},
        growthMetrics,
        fundingStats
      }
    });

  } catch (error) {
    console.error('Error fetching startup profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get startup's growth metrics
exports.getStartupGrowthMetrics = async (req, res) => {
  try {
    const { startupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid startup ID' 
      });
    }

    const metrics = await getStartupGrowthMetrics(startupId);

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get startup's funding history
exports.getStartupFundingHistory = async (req, res) => {
  try {
    const { startupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid startup ID' 
      });
    }

    const fundingHistory = await FundRequest.find({
      startupId,
      status: 'completed'
    })
    .populate('investorId', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: fundingHistory
    });

  } catch (error) {
    console.error('Error fetching funding history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get startup's funding statistics
exports.getStartupFundingStats = async (req, res) => {
  try {
    const { startupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid startup ID' 
      });
    }

    const stats = await calculateStartupFundingStats(startupId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching funding stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get startup's investors
exports.getStartupInvestors = async (req, res) => {
  try {
    const { startupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid startup ID' 
      });
    }

    const investments = await FundRequest.find({
      startupId,
      status: 'completed'
    })
    .populate('investorId', 'name email isSubscribed')
    .sort({ createdAt: -1 });

    // Group by investor
    const investorMap = new Map();
    
    investments.forEach(inv => {
      const investorId = inv.investorId._id.toString();
      if (!investorMap.has(investorId)) {
        investorMap.set(investorId, {
          investor: inv.investorId,
          totalInvested: 0,
          investments: [],
          firstInvestment: inv.createdAt,
          lastInvestment: inv.createdAt
        });
      }
      
      const investorData = investorMap.get(investorId);
      investorData.totalInvested += inv.amount;
      investorData.investments.push({
        amount: inv.amount,
        fundingType: inv.fundingType,
        equityPercentage: inv.equityPercentage,
        date: inv.createdAt
      });
      
      if (inv.createdAt < investorData.firstInvestment) {
        investorData.firstInvestment = inv.createdAt;
      }
      if (inv.createdAt > investorData.lastInvestment) {
        investorData.lastInvestment = inv.createdAt;
      }
    });

    const investors = Array.from(investorMap.values());

    res.json({
      success: true,
      data: {
        totalInvestors: investors.length,
        investors
      }
    });

  } catch (error) {
    console.error('Error fetching startup investors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to get startup growth metrics
async function getStartupGrowthMetrics(startupId) {
  const metrics = await GrowthMetric.find({ startupId })
    .sort({ date: -1 })
    .limit(12); // Last 12 entries

  if (!metrics.length) {
    return {
      current: null,
      history: [],
      trends: {}
    };
  }

  // Get current metrics (latest)
  const current = metrics[0];

  // Calculate trends
  const trends = {};
  if (metrics.length >= 2) {
    const previous = metrics[1];
    
    trends.revenueGrowth = previous.revenue ? 
      ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(2) : 0;
    
    trends.userGrowth = previous.totalUsers ? 
      ((current.totalUsers - previous.totalUsers) / previous.totalUsers * 100).toFixed(2) : 0;
    
    trends.fundingGrowth = previous.fundingRaised ? 
      ((current.fundingRaised - previous.fundingRaised) / previous.fundingRaised * 100).toFixed(2) : 0;
  }

  // Calculate monthly averages
  const monthlyAverages = calculateMonthlyAverages(metrics);

  return {
    current: {
      revenue: current.revenue,
      expenses: current.expenses,
      profit: current.profit,
      fundingRaised: current.fundingRaised,
      totalUsers: current.totalUsers,
      newUsers: current.newUsers,
      churnRate: current.churnRate,
      retentionRate: current.retentionRate,
      date: current.date,
      period: current.period
    },
    history: metrics,
    trends,
    monthlyAverages
  };
}

// Helper function to calculate startup funding statistics
async function calculateStartupFundingStats(startupId) {
  const investments = await FundRequest.find({
    startupId,
    status: 'completed'
  });

  if (!investments.length) {
    return {
      totalFundingRaised: 0,
      totalInvestors: 0,
      totalRounds: 0,
      averageRoundSize: 0,
      fundingTypeBreakdown: {},
      monthlyFunding: {},
      recentRounds: []
    };
  }

  const totalFundingRaised = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const uniqueInvestors = new Set(investments.map(inv => inv.investorId.toString())).size;

  // Funding type breakdown
  const fundingTypeBreakdown = investments.reduce((acc, inv) => {
    acc[inv.fundingType] = (acc[inv.fundingType] || 0) + inv.amount;
    return acc;
  }, {});

  // Monthly funding trend
  const monthlyFunding = investments.reduce((acc, inv) => {
    const month = inv.createdAt.toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + inv.amount;
    return acc;
  }, {});

  // Recent funding rounds
  const recentRounds = investments
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map(inv => ({
      amount: inv.amount,
      fundingType: inv.fundingType,
      investorName: inv.investorId?.name,
      date: inv.createdAt,
      equityPercentage: inv.equityPercentage
    }));

  return {
    totalFundingRaised,
    totalInvestors: uniqueInvestors,
    totalRounds: investments.length,
    averageRoundSize: totalFundingRaised / investments.length,
    fundingTypeBreakdown,
    monthlyFunding,
    recentRounds,
    firstFundingDate: investments[investments.length - 1]?.createdAt,
    lastFundingDate: investments[0]?.createdAt
  };
}

// Helper function to calculate monthly averages
function calculateMonthlyAverages(metrics) {
  if (!metrics.length) return {};

  const total = metrics.length;
  const sum = metrics.reduce((acc, m) => ({
    revenue: (acc.revenue || 0) + (m.revenue || 0),
    expenses: (acc.expenses || 0) + (m.expenses || 0),
    profit: (acc.profit || 0) + (m.profit || 0),
    fundingRaised: (acc.fundingRaised || 0) + (m.fundingRaised || 0),
    totalUsers: (acc.totalUsers || 0) + (m.totalUsers || 0),
    newUsers: (acc.newUsers || 0) + (m.newUsers || 0)
  }), {});

  return {
    avgRevenue: sum.revenue / total,
    avgExpenses: sum.expenses / total,
    avgProfit: sum.profit / total,
    avgFundingRaised: sum.fundingRaised / total,
    avgUsers: sum.totalUsers / total,
    avgNewUsers: sum.newUsers / total
  };
}

// Helper function to get startup additional info
// You'll need to create an AdditionalInfo model for this
async function getStartupAdditionalInfo(startupId) {
  try {
    const response = await fetch(`http://localhost:5001/api/additional-info/${startupId}`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching additional info:', error);
    return null;
  }
}