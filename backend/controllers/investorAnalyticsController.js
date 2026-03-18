const FundRequest = require('../models/FundRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to normalize sector names
const normalizeSector = (domain) => {
  if (!domain) return 'Unknown';
  
  const domainLower = domain.toLowerCase().trim();
  
  // Technology sector normalization
  if (domainLower.includes('tech') || 
      domainLower.includes('technology') || 
      domainLower.includes('software') || 
      domainLower.includes('it ')) {
    return 'Technology';
  }
  
  // Healthcare sector normalization
  if (domainLower.includes('health') || 
      domainLower.includes('medical') || 
      domainLower.includes('pharma') || 
      domainLower.includes('biotech')) {
    return 'Healthcare';
  }
  
  // Finance sector normalization
  if (domainLower.includes('fin') || 
      domainLower.includes('bank') || 
      domainLower.includes('invest') || 
      domainLower.includes('pay')) {
    return 'Finance';
  }
  
  // Education sector normalization
  if (domainLower.includes('edu') || 
      domainLower.includes('learn') || 
      domainLower.includes('course')) {
    return 'Education';
  }
  
  // E-commerce sector normalization
  if (domainLower.includes('ecom') || 
      domainLower.includes('retail') || 
      domainLower.includes('shop') || 
      domainLower.includes('store')) {
    return 'E-commerce';
  }
  
  // Real Estate sector normalization
  if (domainLower.includes('real') || 
      domainLower.includes('estate') || 
      domainLower.includes('property')) {
    return 'Real Estate';
  }
  
  // Food & Beverage sector normalization
  if (domainLower.includes('food') || 
      domainLower.includes('beverage') || 
      domainLower.includes('restaurant')) {
    return 'Food & Beverage';
  }
  
  // Manufacturing sector normalization
  if (domainLower.includes('manufact') || 
      domainLower.includes('factory') || 
      domainLower.includes('production')) {
    return 'Manufacturing';
  }
  
  // Return original with first letter capitalized if no match
  return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
};

// ============= MAIN CONTROLLER FUNCTIONS =============

// Get investor's complete portfolio (only completed investments)
exports.getInvestorPortfolio = async (req, res) => {
  try {
    const { investorId } = req.params;

    // Validate investorId
    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ message: 'Invalid investor ID' });
    }

    // Authorization check
    if (req.user.role === 'investor' && req.user._id.toString() !== investorId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this portfolio' 
      });
    }

    // Get all completed investments for this investor
    const investments = await FundRequest.find({
      investorId,
      status: 'completed'
    }).populate('startupId', 'name email domain yearOfEstablishment teamSize');

    if (!investments.length) {
      return res.json({
        portfolio: {
          totalInvested: 0,
          totalStartups: 0,
          averageInvestment: 0,
          startups: []
        },
        analytics: {
          fundingTypeBreakdown: {},
          monthlyInvestment: {},
          currencyBreakdown: {},
          investmentTimeline: [],
          sectorBreakdown: {},
          investmentSizeDistribution: {}
        }
      });
    }

    // Calculate portfolio statistics
    const portfolio = calculatePortfolioStatistics(investments);
    
    // Calculate detailed analytics with normalized sectors
    const analytics = calculateInvestmentAnalytics(investments);

    res.json({
      portfolio,
      analytics
    });
  } catch (error) {
    console.error('Error fetching investor portfolio:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get investment trends over time
exports.getInvestmentTrends = async (req, res) => {
  try {
    const { investorId } = req.params;
    const { timeframe = 'all' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ message: 'Invalid investor ID' });
    }

    // Authorization check
    if (req.user.role === 'investor' && req.user._id.toString() !== investorId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this data' 
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

    const investments = await FundRequest.find({
      investorId,
      status: 'completed',
      ...dateFilter
    }).populate('startupId', 'name domain');

    // Calculate trends using the helper function
    const trends = calculateInvestmentTrends(investments);

    res.json({
      trends,
      timeframe
    });
  } catch (error) {
    console.error('Error fetching investment trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get startup-wise breakdown for investor
exports.getStartupBreakdown = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ message: 'Invalid investor ID' });
    }

    // Authorization check
    if (req.user.role === 'investor' && req.user._id.toString() !== investorId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this data' 
      });
    }

    const investments = await FundRequest.find({
      investorId,
      status: 'completed'
    }).populate('startupId', 'name email domain yearOfEstablishment teamSize');

    // Group by startup
    const startupMap = new Map();
    
    investments.forEach(inv => {
      const startupId = inv.startupId._id.toString();
      if (!startupMap.has(startupId)) {
        startupMap.set(startupId, {
          startup: {
            ...inv.startupId.toObject(),
            normalizedDomain: normalizeSector(inv.startupId?.domain)
          },
          totalInvested: 0,
          investments: [],
          fundingTypes: new Set(),
          firstInvestment: inv.createdAt,
          lastInvestment: inv.createdAt
        });
      }
      
      const startupData = startupMap.get(startupId);
      startupData.totalInvested += inv.amount;
      startupData.investments.push({
        id: inv._id,
        amount: inv.amount,
        currency: inv.currency,
        fundingType: inv.fundingType,
        equityPercentage: inv.equityPercentage,
        interestRate: inv.interestRate,
        loanTenure: inv.loanTenure,
        createdAt: inv.createdAt,
        completedAt: inv.completedAt,
        description: inv.description,
        useOfFunds: inv.useOfFunds
      });
      startupData.fundingTypes.add(inv.fundingType);
      
      if (inv.createdAt < startupData.firstInvestment) {
        startupData.firstInvestment = inv.createdAt;
      }
      if (inv.createdAt > startupData.lastInvestment) {
        startupData.lastInvestment = inv.createdAt;
      }
    });

    const startups = Array.from(startupMap.values()).map(data => ({
      ...data,
      fundingTypes: Array.from(data.fundingTypes),
      investmentCount: data.investments.length
    }));

    res.json(startups);
  } catch (error) {
    console.error('Error fetching startup breakdown:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get investor's performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ message: 'Invalid investor ID' });
    }

    // Authorization check
    if (req.user.role === 'investor' && req.user._id.toString() !== investorId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this data' 
      });
    }

    const investments = await FundRequest.find({
      investorId,
      status: 'completed'
    }).populate('startupId', 'name domain');

    // Calculate performance metrics with normalized sectors
    const metrics = calculatePerformanceMetrics(investments);

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============= HELPER FUNCTIONS =============

// Helper function to calculate portfolio statistics
function calculatePortfolioStatistics(investments) {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const uniqueStartups = new Set(investments.map(inv => inv.startupId._id.toString())).size;
  
  // Group by startup
  const startupMap = new Map();
  investments.forEach(inv => {
    const startupId = inv.startupId._id.toString();
    if (!startupMap.has(startupId)) {
      startupMap.set(startupId, {
        startup: inv.startupId,
        totalInvested: 0
      });
    }
    startupMap.get(startupId).totalInvested += inv.amount;
  });

  const startups = Array.from(startupMap.values());

  return {
    totalInvested,
    totalStartups: uniqueStartups,
    totalInvestments: investments.length,
    averageInvestment: investments.length > 0 ? totalInvested / investments.length : 0,
    averagePerStartup: uniqueStartups > 0 ? totalInvested / uniqueStartups : 0,
    startups: startups.sort((a, b) => b.totalInvested - a.totalInvested)
  };
}

// Helper function to calculate investment analytics with normalized sectors
function calculateInvestmentAnalytics(investments) {
  // Funding type breakdown
  const fundingTypeBreakdown = investments.reduce((acc, inv) => {
    acc[inv.fundingType] = (acc[inv.fundingType] || 0) + inv.amount;
    return acc;
  }, {});

  // Currency breakdown
  const currencyBreakdown = investments.reduce((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] || 0) + inv.amount;
    return acc;
  }, {});

  // Monthly investment trend
  const monthlyInvestment = investments.reduce((acc, inv) => {
    const month = inv.createdAt.toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + inv.amount;
    return acc;
  }, {});

  // Investment timeline
  const investmentTimeline = investments
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(inv => ({
      date: inv.createdAt,
      amount: inv.amount,
      fundingType: inv.fundingType,
      startupName: inv.startupId?.name,
      startupDomain: normalizeSector(inv.startupId?.domain)
    }));

  // Sector breakdown with NORMALIZATION
  const sectorBreakdown = investments.reduce((acc, inv) => {
    const domain = inv.startupId?.domain || 'Unknown';
    const normalizedSector = normalizeSector(domain);
    acc[normalizedSector] = (acc[normalizedSector] || 0) + inv.amount;
    return acc;
  }, {});

  // Investment size distribution
  const sizeRanges = {
    '0-1L': 0,
    '1L-5L': 0,
    '5L-10L': 0,
    '10L-25L': 0,
    '25L-50L': 0,
    '50L-1Cr': 0,
    '1Cr+': 0
  };

  investments.forEach(inv => {
    const amount = inv.amount;
    if (amount <= 100000) sizeRanges['0-1L']++;
    else if (amount <= 500000) sizeRanges['1L-5L']++;
    else if (amount <= 1000000) sizeRanges['5L-10L']++;
    else if (amount <= 2500000) sizeRanges['10L-25L']++;
    else if (amount <= 5000000) sizeRanges['25L-50L']++;
    else if (amount <= 10000000) sizeRanges['50L-1Cr']++;
    else sizeRanges['1Cr+']++;
  });

  return {
    fundingTypeBreakdown,
    currencyBreakdown,
    monthlyInvestment,
    investmentTimeline,
    sectorBreakdown,
    investmentSizeDistribution: sizeRanges
  };
}

// Helper function to calculate investment trends
function calculateInvestmentTrends(investments) {
  if (investments.length === 0) {
    return {
      totalGrowth: 0,
      monthlyAverage: 0,
      projectedAnnual: 0,
      investmentFrequency: 0,
      recentActivity: []
    };
  }

  const sortedInvestments = investments.sort((a, b) => a.createdAt - b.createdAt);
  const firstDate = sortedInvestments[0].createdAt;
  const lastDate = sortedInvestments[sortedInvestments.length - 1].createdAt;
  
  const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  const totalMonths = totalDays / 30;
  
  const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const monthlyAverage = totalMonths > 0 ? totalAmount / totalMonths : totalAmount;
  
  // Calculate growth rate (period over period)
  let growthRate = 0;
  if (investments.length >= 2) {
    const firstHalf = investments.slice(0, Math.floor(investments.length / 2));
    const secondHalf = investments.slice(Math.floor(investments.length / 2));
    
    const firstHalfTotal = firstHalf.reduce((sum, inv) => sum + inv.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, inv) => sum + inv.amount, 0);
    
    if (firstHalfTotal > 0) {
      growthRate = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    }
  }

  // Investment frequency (investments per month)
  const investmentFrequency = totalMonths > 0 ? investments.length / totalMonths : 0;

  // Recent activity (last 5 investments)
  const recentActivity = investments
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map(inv => ({
      amount: inv.amount,
      startupName: inv.startupId?.name,
      fundingType: inv.fundingType,
      date: inv.createdAt
    }));

  return {
    totalGrowth: growthRate.toFixed(2),
    monthlyAverage,
    projectedAnnual: monthlyAverage * 12,
    investmentFrequency: investmentFrequency.toFixed(2),
    recentActivity,
    totalMonths: totalMonths.toFixed(1)
  };
}

// Helper function to calculate performance metrics with normalized sectors
function calculatePerformanceMetrics(investments) {
  // Equity investments vs Debt investments
  const equityInvestments = investments.filter(inv => inv.fundingType === 'equity');
  const debtInvestments = investments.filter(inv => ['debt', 'venture_debt'].includes(inv.fundingType));
  
  const equityTotal = equityInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const debtTotal = debtInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  // Average equity percentage (for equity investments)
  const avgEquityPercentage = equityInvestments.length > 0 
    ? equityInvestments.reduce((sum, inv) => sum + (inv.equityPercentage || 0), 0) / equityInvestments.length
    : 0;

  // Average interest rate (for debt investments)
  const avgInterestRate = debtInvestments.length > 0
    ? debtInvestments.reduce((sum, inv) => sum + (inv.interestRate || 0), 0) / debtInvestments.length
    : 0;

  // Most active sectors with NORMALIZATION
  const sectorCount = investments.reduce((acc, inv) => {
    const domain = inv.startupId?.domain || 'Unknown';
    const normalizedSector = normalizeSector(domain);
    acc[normalizedSector] = (acc[normalizedSector] || 0) + 1;
    return acc;
  }, {});

  const topSectors = Object.entries(sectorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sector, count]) => ({ sector, count }));

  return {
    equityVsDebt: {
      equity: equityTotal,
      debt: debtTotal,
      equityCount: equityInvestments.length,
      debtCount: debtInvestments.length
    },
    avgEquityPercentage: avgEquityPercentage.toFixed(2),
    avgInterestRate: avgInterestRate.toFixed(2),
    topSectors,
    diversificationScore: calculateDiversificationScore(investments)
  };
}

// Calculate portfolio diversification score (0-100)
function calculateDiversificationScore(investments) {
  if (investments.length === 0) return 0;
  
  const uniqueStartups = new Set(investments.map(inv => inv.startupId._id.toString())).size;
  
  // Use normalized sectors for diversification calculation
  const uniqueSectors = new Set(
    investments.map(inv => normalizeSector(inv.startupId?.domain))
  ).size;
  
  const uniqueTypes = new Set(investments.map(inv => inv.fundingType)).size;
  
  // Simple scoring: more startups, sectors, and types = higher score
  const startupScore = Math.min(uniqueStartups * 10, 40);
  const sectorScore = Math.min(uniqueSectors * 10, 30);
  const typeScore = Math.min(uniqueTypes * 10, 30);
  
  return Math.min(startupScore + sectorScore + typeScore, 100);
}

// Export the normalize function for use in routes if needed
exports.normalizeSector = normalizeSector;