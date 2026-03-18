const FundRequest = require('../models/FundRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all investors who invested in a specific startup with detailed breakdown
exports.getStartupInvestors = async (req, res) => {
  try {
    const { startupId } = req.params;

    // Validate startupId
    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ message: 'Invalid startup ID' });
    }

    // Authorization check - ensure the startup can only access their own data
    if (req.user.role === 'startup' && req.user._id.toString() !== startupId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this startup\'s governance data' 
      });
    }

    // Get ONLY completed fund requests for this startup (removed 'approved')
    const fundRequests = await FundRequest.find({
      startupId,
      status: 'completed'  // Changed from { $in: ['approved', 'completed'] } to just 'completed'
    }).populate('investorId', 'name email domain createdAt');

    if (!fundRequests.length) {
      return res.json({
        investors: [],
        statistics: {
          totalInvestment: 0,
          totalInvestors: 0,
          averageInvestment: 0,
          fundingTypeBreakdown: {},
          monthlyInvestment: {},
          currencyBreakdown: {},
          investmentTimeline: []
        }
      });
    }

    // Calculate comprehensive statistics
    const statistics = calculateInvestmentStatistics(fundRequests);

    // Group investors with their investments
    const investorsMap = new Map();
    
    fundRequests.forEach(request => {
      const investorId = request.investorId._id.toString();
      if (!investorsMap.has(investorId)) {
        investorsMap.set(investorId, {
          investor: request.investorId,
          totalInvested: 0,
          investments: [],
          fundingTypes: new Set(),
          firstInvestment: request.createdAt,
          lastInvestment: request.createdAt
        });
      }
      
      const investorData = investorsMap.get(investorId);
      investorData.totalInvested += request.amount;
      investorData.investments.push({
        id: request._id,
        amount: request.amount,
        currency: request.currency,
        fundingType: request.fundingType,
        equityPercentage: request.equityPercentage,
        interestRate: request.interestRate,
        loanTenure: request.loanTenure,
        status: request.status,
        createdAt: request.createdAt,
        approvedAt: request.approvedAt,
        completedAt: request.completedAt,
        description: request.description,
        useOfFunds: request.useOfFunds
      });
      investorData.fundingTypes.add(request.fundingType);
      
      if (request.createdAt < investorData.firstInvestment) {
        investorData.firstInvestment = request.createdAt;
      }
      if (request.createdAt > investorData.lastInvestment) {
        investorData.lastInvestment = request.createdAt;
      }
    });

    // Convert Map to array and add derived fields
    const investors = Array.from(investorsMap.values()).map(data => ({
      ...data,
      fundingTypes: Array.from(data.fundingTypes),
      investmentCount: data.investments.length
    }));

    res.json({
      investors,
      statistics
    });
  } catch (error) {
    console.error('Error fetching startup investors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get detailed investment statistics for a startup
exports.getInvestmentStatistics = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { timeframe = 'all' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ message: 'Invalid startup ID' });
    }

    // Authorization check
    if (req.user.role === 'startup' && req.user._id.toString() !== startupId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this startup\'s statistics' 
      });
    }

    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'month') {
      dateFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) } };
    } else if (timeframe === 'quarter') {
      dateFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 3)) } };
    } else if (timeframe === 'year') {
      dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
    }

    // Get ONLY completed fund requests (removed 'approved')
    const fundRequests = await FundRequest.find({
      startupId,
      status: 'completed',  // Changed from { $in: ['approved', 'completed'] } to just 'completed'
      ...dateFilter
    });

    const statistics = calculateInvestmentStatistics(fundRequests);

    // Add trend analysis
    const trends = await calculateInvestmentTrends(startupId, fundRequests);

    res.json({
      statistics,
      trends,
      timeframe
    });
  } catch (error) {
    console.error('Error fetching investment statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get funding requests timeline - Keep this showing all statuses for historical view
exports.getFundingTimeline = async (req, res) => {
  try {
    const { startupId } = req.params;

    // Authorization check
    if (req.user.role === 'startup' && req.user._id.toString() !== startupId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this startup\'s timeline' 
      });
    }

    // Keep timeline showing all statuses for complete history
    const timeline = await FundRequest.find({ startupId })
      .sort({ createdAt: -1 })
      .select('amount currency fundingType status createdAt approvedAt completedAt rejectedAt description')
      .populate('investorId', 'name email');

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching funding timeline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get investor concentration analysis
exports.getInvestorConcentration = async (req, res) => {
  try {
    const { startupId } = req.params;

    // Authorization check
    if (req.user.role === 'startup' && req.user._id.toString() !== startupId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this startup\'s concentration data' 
      });
    }

    // Get ONLY completed fund requests (removed 'approved')
    const fundRequests = await FundRequest.find({
      startupId,
      status: 'completed'  // Changed from { $in: ['approved', 'completed'] } to just 'completed'
    });

    const totalInvestment = fundRequests.reduce((sum, req) => sum + req.amount, 0);
    
    const investorShares = {};
    fundRequests.forEach(request => {
      const investorId = request.investorId.toString();
      if (!investorShares[investorId]) {
        investorShares[investorId] = 0;
      }
      investorShares[investorId] += request.amount;
    });

    const concentration = Object.entries(investorShares).map(([investorId, amount]) => ({
      investorId,
      amount,
      percentage: totalInvestment > 0 ? ((amount / totalInvestment) * 100).toFixed(2) : 0
    })).sort((a, b) => b.amount - a.amount);

    // Calculate Herfindahl-Hirschman Index (HHI) for investor concentration
    const hhi = concentration.reduce((sum, item) => {
      return sum + Math.pow(parseFloat(item.percentage), 2);
    }, 0);

    res.json({
      totalInvestment,
      totalInvestors: concentration.length,
      concentration,
      hhi: hhi.toFixed(2),
      concentrationLevel: hhi < 1500 ? 'Low' : hhi < 2500 ? 'Moderate' : 'High'
    });
  } catch (error) {
    console.error('Error calculating investor concentration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to calculate investment statistics
function calculateInvestmentStatistics(fundRequests) {
  const totalInvestment = fundRequests.reduce((sum, req) => sum + req.amount, 0);
  const totalInvestors = new Set(fundRequests.map(req => req.investorId.toString())).size;
  
  // Funding type breakdown
  const fundingTypeBreakdown = fundRequests.reduce((acc, req) => {
    acc[req.fundingType] = (acc[req.fundingType] || 0) + req.amount;
    return acc;
  }, {});

  // Currency breakdown
  const currencyBreakdown = fundRequests.reduce((acc, req) => {
    acc[req.currency] = (acc[req.currency] || 0) + req.amount;
    return acc;
  }, {});

  // Monthly investment trend
  const monthlyInvestment = fundRequests.reduce((acc, req) => {
    const month = req.createdAt.toISOString().slice(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + req.amount;
    return acc;
  }, {});

  // Investment timeline for charts
  const investmentTimeline = fundRequests
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(req => ({
      date: req.createdAt,
      amount: req.amount,
      fundingType: req.fundingType,
      investorId: req.investorId,
      completedAt: req.completedAt
    }));

  // Equity vs Debt analysis
  const equityTotal = fundRequests
    .filter(req => req.fundingType === 'equity')
    .reduce((sum, req) => sum + req.amount, 0);
  
  const debtTotal = fundRequests
    .filter(req => ['debt', 'venture_debt'].includes(req.fundingType))
    .reduce((sum, req) => sum + req.amount, 0);

  // Average investment size
  const averageInvestment = fundRequests.length > 0 ? totalInvestment / fundRequests.length : 0;

  return {
    totalInvestment,
    totalInvestors,
    totalTransactions: fundRequests.length,
    averageInvestment,
    equityTotal,
    debtTotal,
    fundingTypeBreakdown,
    currencyBreakdown,
    monthlyInvestment,
    investmentTimeline,
    largestInvestment: fundRequests.length > 0 ? Math.max(...fundRequests.map(req => req.amount)) : 0,
    smallestInvestment: fundRequests.length > 0 ? Math.min(...fundRequests.map(req => req.amount)) : 0
  };
}

// Helper function to calculate investment trends
async function calculateInvestmentTrends(startupId, currentRequests) {
  // Get historical data for comparison - ONLY completed
  const allRequests = await FundRequest.find({
    startupId,
    status: 'completed'  // Changed to only completed
  }).sort({ createdAt: 1 });

  if (allRequests.length < 2) {
    return {
      growthRate: 0,
      investorGrowth: 0,
      averageGrowthRate: 0
    };
  }

  const firstInvestment = allRequests[0].createdAt;
  const lastInvestment = allRequests[allRequests.length - 1].createdAt;
  const monthsDiff = (lastInvestment - firstInvestment) / (1000 * 60 * 60 * 24 * 30);
  
  const totalInvestment = allRequests.reduce((sum, req) => sum + req.amount, 0);
  const monthlyAverage = monthsDiff > 0 ? totalInvestment / monthsDiff : totalInvestment;

  // Calculate growth rate (simple average of period-over-period growth)
  let totalGrowthRate = 0;
  let periods = 0;
  
  for (let i = 1; i < allRequests.length; i++) {
    const prevPeriod = allRequests.slice(0, i).reduce((sum, req) => sum + req.amount, 0);
    const currentPeriod = allRequests.slice(0, i + 1).reduce((sum, req) => sum + req.amount, 0);
    if (prevPeriod > 0) {
      const growthRate = ((currentPeriod - prevPeriod) / prevPeriod) * 100;
      totalGrowthRate += growthRate;
      periods++;
    }
  }

  return {
    monthlyAverage,
    totalGrowthRate: periods > 0 ? (totalGrowthRate / periods).toFixed(2) : 0,
    investorGrowth: new Set(allRequests.map(r => r.investorId)).size,
    timeSpanMonths: monthsDiff.toFixed(1)
  };
}