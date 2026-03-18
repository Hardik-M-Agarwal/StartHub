const User = require('../models/User');
const FundRequest = require('../models/FundRequest');
const mongoose = require('mongoose');

// Get investor profile with complete details and statistics
exports.getInvestorProfile = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid investor ID' 
      });
    }

    // Get investor basic info from User model
    const investor = await User.findById(investorId).select('-password');
    
    if (!investor || investor.role !== 'investor') {
      return res.status(404).json({ 
        success: false, 
        message: 'Investor not found' 
      });
    }

    // Get additional info from the database (you'll need to create this model if it doesn't exist)
    // For now, we'll create a placeholder for additional info
    // You should create an InvestorProfile model for this data
    const additionalInfo = await getInvestorAdditionalInfo(investorId);

    // Get investment statistics from FundRequest model
    const investmentStats = await calculateInvestorStats(investorId);

    res.json({
      success: true,
      data: {
        user: {
          _id: investor._id,
          name: investor.name,
          email: investor.email,
          role: investor.role,
          isSubscribed: investor.isSubscribed,
          subscription: investor.subscription,
          createdAt: investor.createdAt
        },
        additionalInfo: additionalInfo || {},
        investmentStats
      }
    });

  } catch (error) {
    console.error('Error fetching investor profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get investor's investment history
exports.getInvestorInvestments = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid investor ID' 
      });
    }

    const investments = await FundRequest.find({
      investorId,
      status: 'completed'
    })
    .populate('startupId', 'name email domain yearOfEstablishment teamSize')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: investments
    });

  } catch (error) {
    console.error('Error fetching investor investments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get investor's portfolio summary
exports.getInvestorPortfolioSummary = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid investor ID' 
      });
    }

    const stats = await calculateInvestorStats(investorId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to calculate investor statistics
async function calculateInvestorStats(investorId) {
  // Get all completed investments
  const investments = await FundRequest.find({
    investorId,
    status: 'completed'
  }).populate('startupId', 'domain fundingType');

  // Basic statistics
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvestments = investments.length;
  const uniqueStartups = new Set(investments.map(inv => inv.startupId?._id?.toString())).size;

  // Funding type breakdown
  const fundingTypeBreakdown = investments.reduce((acc, inv) => {
    acc[inv.fundingType] = (acc[inv.fundingType] || 0) + inv.amount;
    return acc;
  }, {});

  // Sector breakdown
  const sectorBreakdown = investments.reduce((acc, inv) => {
    const sector = inv.startupId?.domain || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {});

  // Recent investments (last 5)
  const recentInvestments = investments
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map(inv => ({
      startupName: inv.startupId?.name,
      amount: inv.amount,
      fundingType: inv.fundingType,
      date: inv.createdAt
    }));

  // Calculate average investment size
  const avgInvestmentSize = totalInvestments > 0 ? totalInvested / totalInvestments : 0;

  // Find largest and smallest investments
  const investmentSizes = investments.map(inv => inv.amount);
  const largestInvestment = investmentSizes.length > 0 ? Math.max(...investmentSizes) : 0;
  const smallestInvestment = investmentSizes.length > 0 ? Math.min(...investmentSizes) : 0;

  // Monthly investment trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyTrend = {};
  investments
    .filter(inv => inv.createdAt >= sixMonthsAgo)
    .forEach(inv => {
      const month = inv.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyTrend[month] = (monthlyTrend[month] || 0) + inv.amount;
    });

  return {
    totalInvested,
    totalInvestments,
    uniqueStartups,
    avgInvestmentSize,
    largestInvestment,
    smallestInvestment,
    fundingTypeBreakdown,
    sectorBreakdown,
    recentInvestments,
    monthlyTrend
  };
}

// Helper function to get investor additional info
// You'll need to create an InvestorProfile model for this
async function getInvestorAdditionalInfo(investorId) {
  // This is a placeholder - you should create a proper InvestorProfile model
  // For now, return empty object
  return {};
}

// If you have an InvestorProfile model, uncomment and use this:
/*
const InvestorProfile = require('../models/InvestorProfile');

async function getInvestorAdditionalInfo(investorId) {
  const profile = await InvestorProfile.findOne({ investorId });
  return profile || null;
}
*/