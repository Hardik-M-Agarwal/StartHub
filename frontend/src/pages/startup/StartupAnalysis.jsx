import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';

const StartupAnalysis = () => {
  const { startup_id } = useParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    founder_names: '',
    team_experience_rating: 6,
    market_size_estimate_usd: '',
    revenue_model: 'SaaS',
    monthly_revenue: '',
    monthly_burn: '',
    cac: '',
    ltv: '',
    competition_level: 5,
    runway_months: '',
    expected_monthly_growth_pct: 5,
    userId: startup_id
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Prepare payload with proper data types
      const payload = {
        ...formData,
        founder_names: formData.founder_names.split(',').map(s => s.trim()).filter(Boolean),
        market_size_estimate_usd: Number(formData.market_size_estimate_usd) || 0,
        monthly_revenue: Number(formData.monthly_revenue) || 0,
        monthly_burn: Number(formData.monthly_burn) || 0,
        cac: Number(formData.cac) || 0,
        ltv: Number(formData.ltv) || 0,
        runway_months: Number(formData.runway_months) || 0,
        team_experience_rating: Number(formData.team_experience_rating),
        competition_level: Number(formData.competition_level),
        expected_monthly_growth_pct: Number(formData.expected_monthly_growth_pct)
      };

      console.log('📤 Submitting startup analysis:', payload);

      const response = await api.post('/startups', payload);
      console.log('📥 Startup analysis response:', response);

      // Handle different response structures
      if (response && response.success) {
        setResult(response.data || response.startup || response);
      } else {
        // If structure is different, try to find the data
        const resultData = response?.data || response?.startup || response;
        if (resultData) {
          setResult(resultData);
        } else {
          throw new Error('Invalid response format from server');
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing startup:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error analyzing startup. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'viable': return 'text-green-600 bg-green-100';
      case 'caution': return 'text-yellow-600 bg-yellow-100';
      case 'risky': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Analyzing your startup...</p>
          <p className="text-sm text-gray-500 text-center mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Startup Analysis</h1>
          <p className="text-gray-600">
            Get AI-powered analysis of your startup with detailed scoring, financial projections, and recommendations
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!result ? (
          /* Analysis Form */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startup Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter startup name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revenue Model
                  </label>
                  <select
                    name="revenue_model"
                    value={formData.revenue_model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Ad">Advertising</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Transaction fee">Transaction Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your startup, product, and target market..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founder Names (comma separated)
                </label>
                <input
                  type="text"
                  name="founder_names"
                  value={formData.founder_names}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe, Jane Smith"
                />
              </div>

              {/* Team & Market */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Experience Rating (1-10)
                  </label>
                  <input
                    type="range"
                    name="team_experience_rating"
                    min="1"
                    max="10"
                    value={formData.team_experience_rating}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {formData.team_experience_rating}/10
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competition Level (1-10)
                  </label>
                  <input
                    type="range"
                    name="competition_level"
                    min="1"
                    max="10"
                    value={formData.competition_level}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {formData.competition_level}/10
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Size Estimate (USD)
                  </label>
                  <input
                    type="number"
                    name="market_size_estimate_usd"
                    value={formData.market_size_estimate_usd}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 10000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Monthly Growth (%)
                  </label>
                  <input
                    type="number"
                    name="expected_monthly_growth_pct"
                    value={formData.expected_monthly_growth_pct}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Revenue (USD)
                  </label>
                  <input
                    type="number"
                    name="monthly_revenue"
                    value={formData.monthly_revenue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Burn (USD)
                  </label>
                  <input
                    type="number"
                    name="monthly_burn"
                    value={formData.monthly_burn}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 8000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Runway (Months)
                  </label>
                  <input
                    type="number"
                    name="runway_months"
                    value={formData.runway_months}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Acquisition Cost (CAC)
                  </label>
                  <input
                    type="number"
                    name="cac"
                    value={formData.cac}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lifetime Value (LTV)
                  </label>
                  <input
                    type="number"
                    name="ltv"
                    value={formData.ltv}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors duration-200"
                >
                  {loading ? 'Analyzing...' : 'Analyze Startup'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{result.name}</h2>
                  <p className="text-gray-600 mt-1">{result.description}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(result.result?.score)}`}>
                    {result.result?.score || 0}/100
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(result.result?.verdict)}`}>
                    {(result.result?.verdict || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Component Scores */}
            {result.result?.components && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(result.result.components).map(([key, score]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{score}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {key === 'comp' ? 'Competition' : 
                         key === 'unit' ? 'Unit Econ' : 
                         key === 'market' ? 'Market' :
                         key === 'team' ? 'Team' :
                         key === 'financials' ? 'Financials' : key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {result.result?.openai_analysis && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{result.result.openai_analysis}</p>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.result?.suggestions && result.result.suggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {result.result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Financial Projections */}
            {result.result?.projection?.monthly && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Projections</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Burn</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.result.projection.monthly.slice(0, 12).map((month) => (
                        <tr key={month.month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Month {month.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(month.revenue || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(month.burn || 0).toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            (month.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(month.profit || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.result.projection.breakEvenMonth && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 font-medium">
                      Projected Break-even: Month {result.result.projection.breakEvenMonth}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Analyze Another Startup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupAnalysis;