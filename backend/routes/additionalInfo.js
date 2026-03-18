const express = require('express');
const router = express.Router();

// Try to import the model
let AdditionalInfo;
try {
  AdditionalInfo = require('../models/AdditionalInfo');
} catch (error) {
  console.error('❌ Failed to load AdditionalInfo model:', error.message);
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Additional Info API is working',
    modelLoaded: !!AdditionalInfo,
    timestamp: new Date().toISOString()
  });
});

// Get additional info for a user
router.get('/:userId', async (req, res) => {
  try {
    console.log('🔍 Fetching additional info for user:', req.params.userId);
    
    if (!AdditionalInfo) {
      console.error('❌ AdditionalInfo model not loaded');
      return res.status(500).json({
        success: false,
        message: 'Database model not available'
      });
    }

    const additionalInfo = await AdditionalInfo.findOne({ 
      userId: req.params.userId 
    });
    
    if (!additionalInfo) {
      console.log('ℹ️ No additional info found for user:', req.params.userId);
      return res.status(200).json({ 
        success: true,
        data: null,
        message: 'No additional information found'
      });
    }
    
    console.log('✅ Found additional info for user:', req.params.userId);
    res.json({
      success: true,
      data: additionalInfo
    });
    
  } catch (error) {
    console.error('❌ Error fetching additional info:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Create or update additional info
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received POST request to /api/additional-info');
    
    const { userId, role, ...updateData } = req.body;
    
    console.log('👤 UserId:', userId);
    console.log('🎭 Role:', role);
    console.log('📊 Update data keys:', Object.keys(updateData));

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: 'Role is required' 
      });
    }

    if (!AdditionalInfo) {
      return res.status(500).json({
        success: false,
        message: 'Database model not available'
      });
    }

    // Calculate profile completion
    const filledFields = Object.values(updateData).filter(val => 
      val !== undefined && val !== null && val !== '' && 
      (!Array.isArray(val) || val.length > 0)
    ).length;
    
    const totalFields = Object.keys(updateData).length;
    const profileCompletion = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    // Create or update the additional info
    const additionalInfo = await AdditionalInfo.findOneAndUpdate(
      { userId },
      { 
        userId, 
        role, 
        ...updateData,
        profileCompletion,
        lastUpdated: new Date()
      },
      { 
        new: true, 
        upsert: true
      }
    );
    
    console.log('✅ Successfully saved additional info for user:', userId);
    
    res.json({
      success: true,
      message: 'Additional information saved successfully',
      data: additionalInfo,
      profileCompletion: profileCompletion
    });
    
  } catch (error) {
    console.error('❌ Error saving additional info:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;