const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function buildPrompt(payload, scoreInfo, projection) {
  return `You are an experienced startup investor analyzing a new venture. Please provide a concise professional assessment.

STARTUP DETAILS:
• Name: ${payload.name || 'Not specified'}
• Description: ${payload.description || 'Not specified'}
• Founders: ${payload.founder_names?.join(', ') || 'Not specified'}
• Revenue Model: ${payload.revenue_model || 'Not specified'}

FINANCIAL METRICS:
• Monthly Revenue: $${(payload.monthly_revenue || 0).toLocaleString()}
• Monthly Burn: $${(payload.monthly_burn || 0).toLocaleString()}
• CAC: $${payload.cac || 'N/A'}
• LTV: $${payload.ltv || 'N/A'}
• Runway: ${payload.runway_months || 'N/A'} months

MARKET & TEAM:
• Market Size: $${(payload.market_size_estimate_usd || 'N/A').toLocaleString()}
• Team Experience: ${payload.team_experience_rating || 'N/A'}/10
• Competition Level: ${payload.competition_level || 'N/A'}/10

CALCULATED SCORE: ${scoreInfo.total}/100
Break-even projection: ${projection.breakEvenMonth ? `Month ${projection.breakEvenMonth}` : 'None within 12 months'}

Please provide:
1. A brief overall assessment (2-3 sentences)
2. Top 3 strengths or concerns
3. Key recommendation for next steps

Keep response under 300 words, professional tone.`;
}

async function analyzeWithOpenAI(payload, scoreInfo, projection) {
  if (!genAI) {
    console.log('⚠️ Gemini API key not provided - skipping AI analysis');
    return generateFallbackAnalysis(payload, scoreInfo, projection);
  }

  try {
    const prompt = buildPrompt(payload, scoreInfo, projection);
    console.log('🔧 Prompt built successfully');

    // ✅ Try BOTH new and old models for maximum compatibility
    const geminiModels = [
      // New Gemini 2.5 models (if available)
      "gemini-2.0-flash-exp",      // Experimental but often available
      "gemini-1.5-flash",          // Widely available Flash model
      "gemini-1.5-pro",            // Widely available Pro model
      "gemini-1.0-pro",            // Original Pro model
      "gemini-pro",                // Generic name
    ];

    for (const modelName of geminiModels) {
      try {
        console.log(`🔄 Attempting with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(`✅ SUCCESS! AI analysis completed using ${modelName}`);
        return response.text();
      } catch (modelErr) {
        console.log(`❌ ${modelName} failed: ${modelErr.message}`);
        continue;
      }
    }

    throw new Error('All Gemini model attempts failed');
    
  } catch (err) {
    console.error('❌ Final Gemini API error:', err.message);
    return generateFallbackAnalysis(payload, scoreInfo, projection);
  }
}

function generateFallbackAnalysis(payload, scoreInfo, projection) {
  return `**AI ANALYSIS TEMPORARILY UNAVAILABLE**

We're currently experiencing issues with our AI analysis service. Your startup has been scored using our algorithmic assessment, but personalized AI recommendations are temporarily unavailable.

**Algorithmic Assessment:**
- **Score:** ${scoreInfo.total}/100
- **Financial Health:** ${(payload.monthly_revenue || 0) >= (payload.monthly_burn || 0) ? '✅ Positive Cash Flow' : '⚠️ Negative Cash Flow'}
- **Break-even:** ${projection.breakEvenMonth ? `Month ${projection.breakEvenMonth}` : 'Beyond 12 months'}

*Please try again later for AI-powered personalized recommendations, or contact support if this issue persists.*`;
}

module.exports = { analyzeWithOpenAI };