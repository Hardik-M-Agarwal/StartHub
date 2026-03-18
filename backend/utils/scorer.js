/**
 * Utility functions for scoring startup viability
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreMarketSize(marketUSD) {
  if (!marketUSD || marketUSD <= 0) return 0;
  
  const logScore = Math.log10(marketUSD + 1) / 10 * 30;
  return clamp(logScore, 0, 30);
}

function scoreUnitEconomics(cac, ltv) {
  if (!cac || !ltv || cac <= 0) return 0;
  
  const ratio = ltv / cac;
  let score = ((ratio - 1) / 4) * 30 + 10;
  return clamp(score, 0, 30);
}

function scoreRunwayAndBurn(runwayMonths, monthlyBurn, monthlyRevenue) {
  if (!monthlyBurn) return 10;
  
  if (monthlyRevenue >= monthlyBurn) return 20;
  
  return clamp((runwayMonths / 18) * 20, 0, 20);
}

function scoreCompetition(competitionLevel) {
  return clamp((11 - competitionLevel) / 10 * 10, 0, 10);
}

function scoreTeam(teamRating) {
  return clamp((teamRating / 10) * 10, 0, 10);
}

function computeFinalScore(payload) {
  const components = {
    market: scoreMarketSize(payload.market_size_estimate_usd || 0),
    unit: scoreUnitEconomics(payload.cac, payload.ltv),
    runway: scoreRunwayAndBurn(
      payload.runway_months || 0, 
      payload.monthly_burn || 0, 
      payload.monthly_revenue || 0
    ),
    comp: scoreCompetition(payload.competition_level || 5),
    team: scoreTeam(payload.team_experience_rating || 5)
  };

  const total = Object.values(components).reduce((sum, score) => sum + score, 0);
  
  const roundedComponents = {};
  Object.keys(components).forEach(key => {
    roundedComponents[key] = Math.round(components[key]);
  });
  
  return { 
    components: roundedComponents, 
    total: Math.round(clamp(total, 0, 100)) 
  };
}

function projectProfitLoss({ monthly_revenue = 0, monthly_burn = 0, growth_rate_pct = 5, months = 12 }) {
  const monthly = [];
  let revenue = monthly_revenue;
  const growth = (growth_rate_pct || 0) / 100;
  
  for (let m = 1; m <= months; m++) {
    const profit = revenue - monthly_burn;
    monthly.push({ 
      month: m, 
      revenue: Math.round(revenue), 
      burn: Math.round(monthly_burn), 
      profit: Math.round(profit) 
    });
    revenue = revenue * (1 + growth);
  }
  
  let cumulative = 0;
  let breakEvenMonth = null;
  
  for (const period of monthly) {
    cumulative += period.profit;
    if (breakEvenMonth === null && cumulative >= 0) {
      breakEvenMonth = period.month;
    }
  }
  
  return { monthly, breakEvenMonth };
}

function generateSuggestions(components, totalScore, payload, projection) {
  const suggestions = [];
  
  if (components.unit < 15) {
    suggestions.push('🔧 Improve unit economics: reduce CAC or increase LTV');
  }
  if (components.market < 10) {
    suggestions.push('🎯 Market size appears small — consider adjacent opportunities');
  }
  if (payload.monthly_revenue < payload.monthly_burn) {
    suggestions.push('💰 Revenue < burn rate — reduce costs or increase revenue urgently');
  }
  if (payload.runway_months < 6) {
    suggestions.push('⏰ Runway <6 months — seek funding or cut costs immediately');
  }
  if (payload.competition_level >= 8) {
    suggestions.push('🏆 High competition — focus on strong differentiation');
  }
  if (components.team < 6) {
    suggestions.push('👥 Consider strengthening team experience or advisors');
  }

  if (projection.breakEvenMonth === null) {
    suggestions.push('📈 No break-even projected within 12 months — review growth strategy');
  } else if (projection.breakEvenMonth <= 6) {
    suggestions.push(`✅ Projected break-even by month ${projection.breakEvenMonth} — looking good!`);
  } else {
    suggestions.push(`📊 Break-even projected by month ${projection.breakEvenMonth}`);
  }

  let verdict;
  if (totalScore >= 70) {
    verdict = 'viable';
    suggestions.unshift('✅ Strong potential — focus on execution and scaling');
  } else if (totalScore >= 45) {
    verdict = 'caution';
    suggestions.unshift('⚠️ Moderate potential — address key weaknesses before scaling');
  } else {
    verdict = 'risky';
    suggestions.unshift('🚨 High risk — significant improvements needed for viability');
  }

  if (suggestions.length === 1) {
    suggestions.push('📋 Consider conducting market validation and user research');
  }

  return { suggestions, verdict };
}

module.exports = { 
  computeFinalScore, 
  projectProfitLoss, 
  generateSuggestions 
};