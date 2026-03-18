const Startup = require('../models/Startup');
const { computeFinalScore, projectProfitLoss, generateSuggestions } = require('../utils/scorer');
const { analyzeWithOpenAI } = require('../services/openaiClient');

// Input validation middleware
function validateInput(req, res, next) {
  const { name, monthly_revenue, monthly_burn, userId } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Startup name is required' 
    });
  }
  
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      error: 'User ID is required' 
    });
  }
  
  if (monthly_revenue < 0 || monthly_burn < 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Revenue and burn cannot be negative' 
    });
  }
  
  next();
}

// Create startup analysis
exports.createStartupAnalysis = [validateInput, async (req, res) => {
  try {
    console.log('📊 Processing startup validation request...');
    
    const payload = { ...req.body };
    
    // Convert string numbers to actual numbers
    Object.keys(payload).forEach(key => {
      if (payload[key] !== '' && !isNaN(payload[key]) && typeof payload[key] === 'string') {
        payload[key] = Number(payload[key]);
      }
    });

    // Map userId to user field for Mongoose
    const startupData = {
      ...payload,
      user: payload.userId // Map userId to user field
    };

    // FIX: Add debug log to check if function exists
    console.log('🔧 Checking computeFinalScore function:', typeof computeFinalScore);
    
    // Compute scoring
    const scoreInfo = computeFinalScore(payload);
    console.log('✅ Score computed:', scoreInfo);
    
    // Generate financial projections
    const projection = projectProfitLoss({
      monthly_revenue: payload.monthly_revenue || 0,
      monthly_burn: payload.monthly_burn || 0,
      growth_rate_pct: payload.expected_monthly_growth_pct || 5,
      months: 12
    });

    // Generate suggestions and verdict
    const { suggestions, verdict } = generateSuggestions(
      scoreInfo.components, 
      scoreInfo.total, 
      payload, 
      projection
    );

    // Get AI analysis
    console.log('🤖 Requesting AI analysis...');
    const openai_analysis = await analyzeWithOpenAI(payload, scoreInfo, projection);

    // Create and save startup record
    const startup = new Startup({
      ...startupData,
      result: {
        score: scoreInfo.total,
        verdict,
        suggestions,
        projection,
        openai_analysis,
        components: scoreInfo.components
      }
    });

    await startup.save();
    console.log('✅ Startup analysis completed and saved');

    // Send response
    res.json({
      success: true,
      message: 'Startup analysis completed successfully',
      startup: {
        ...startup.toObject(),
        result: {
          score: scoreInfo.total,
          verdict,
          suggestions,
          projection,
          openai_analysis,
          components: scoreInfo.components
        }
      }
    });

  } catch (err) {
    console.error('❌ Validation error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error during analysis',
      message: err.message
    });
  }
}];

// Get user's startup analyses
exports.getUserStartups = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const startups = await Startup.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Startup.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      startups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching startup analyses',
      error: error.message
    });
  }
};

// Get single startup analysis
exports.getStartupAnalysis = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup analysis not found'
      });
    }

    res.status(200).json({
      success: true,
      startup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching startup analysis',
      error: error.message
    });
  }
};

// Delete startup analysis
exports.deleteStartupAnalysis = async (req, res) => {
  try {
    const { userId } = req.body;
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup analysis not found'
      });
    }

    if (startup.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this analysis'
      });
    }

    await Startup.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Startup analysis deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting startup analysis',
      error: error.message
    });
  }
};