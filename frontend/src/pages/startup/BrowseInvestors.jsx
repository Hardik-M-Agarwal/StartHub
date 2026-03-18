import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BrowseInvestorsPage = () => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    investmentFocus: '',
    investmentStage: '',
    checkSize: '',
    geographicFocus: ''
  });
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [investorProfiles, setInvestorProfiles] = useState({});
  const navigate = useNavigate();

  // Fetch all investors
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      
      const usersResponse = await fetch('http://localhost:5001/api/users/chat/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersResult = await usersResponse.json();
      
      if (usersResult.success) {
        // Filter only investors
        const investorUsers = usersResult.data.users.filter(user => user.role === 'investor');
        
        // Fetch detailed profile for each investor
        const investorsWithDetails = await Promise.all(
          investorUsers.map(async (investor) => {
            try {
              // Fetch investor profile with stats
              const profileResponse = await fetch(`http://localhost:5001/api/investors/profile/${investor.userId}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                return {
                  ...investor,
                  profile: profileData.data
                };
              }
              return { ...investor, profile: null };
            } catch (error) {
              console.error(`Error fetching profile for ${investor.userId}:`, error);
              return { ...investor, profile: null };
            }
          })
        );
        
        setInvestors(investorsWithDetails);
      } else {
        throw new Error(usersResult.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching investors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter(investor => {
    const profile = investor.profile;
    const additionalInfo = profile?.additionalInfo || {};
    const stats = profile?.investmentStats || {};

    // Search in name, email, and investment stats
    const matchesSearch = !searchTerm || 
      investor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stats.sectorBreakdown && Object.keys(stats.sectorBreakdown).some(sector => 
        sector.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    // Investment focus filter (using sector breakdown from actual investments)
    const matchesInvestmentFocus = !filters.investmentFocus || 
      (stats.sectorBreakdown && stats.sectorBreakdown[filters.investmentFocus]);

    // Investment stage (from additional info or inferred from investment sizes)
    const matchesInvestmentStage = !filters.investmentStage;

    // Check size filter (using actual investment data)
    const matchesCheckSize = !filters.checkSize || (() => {
      const avgSize = stats.avgInvestmentSize || 0;
      if (filters.checkSize === 'small') return avgSize < 100000;
      if (filters.checkSize === 'medium') return avgSize >= 100000 && avgSize < 1000000;
      if (filters.checkSize === 'large') return avgSize >= 1000000;
      return true;
    })();

    // Geographic focus (from additional info or default to empty)
    const matchesGeographicFocus = !filters.geographicFocus;

    return matchesSearch && matchesInvestmentFocus && matchesInvestmentStage && 
           matchesGeographicFocus && matchesCheckSize;
  });

  // Get unique values for filters from actual data
  const investmentFocuses = [...new Set(
    investors.flatMap(inv => 
      Object.keys(inv.profile?.investmentStats?.sectorBreakdown || {})
    )
  )].filter(Boolean);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      investmentFocus: '',
      investmentStage: '',
      checkSize: '',
      geographicFocus: ''
    });
    setSearchTerm('');
  };

  const handleConnect = (investorId) => {
    navigate(`/chat?user=${investorId}`);
  };

  const handleVideoCall = async (investorId) => {
    try {
      const response = await fetch('http://localhost:5001/api/call/generate-room');
      const result = await response.json();
      
      if (result.success) {
        navigate(`/call/${result.data.roomId}?targetUser=${investorId}`);
      }
    } catch (error) {
      console.error('Error generating call room:', error);
    }
  };

  const handleShowDetails = (investor) => {
    setSelectedInvestor(investor);
    setShowDetailModal(true);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // Format number for display
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading investors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchInvestors}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Investors
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with verified investors who have a track record of funding startups
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search investors by name, email, or investment sectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Sectors
              </label>
              <select
                value={filters.investmentFocus}
                onChange={(e) => handleFilterChange('investmentFocus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Sectors</option>
                {investmentFocuses.map(focus => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Stage
              </label>
              <select
                value={filters.investmentStage}
                onChange={(e) => handleFilterChange('investmentStage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Stages</option>
                <option value="seed">Seed</option>
                <option value="early">Early Stage</option>
                <option value="growth">Growth</option>
                <option value="late">Late Stage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Check Size
              </label>
              <select
                value={filters.checkSize}
                onChange={(e) => handleFilterChange('checkSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Any Size</option>
                <option value="small">Under ₹1L</option>
                <option value="medium">₹1L - ₹10L</option>
                <option value="large">₹10L+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geographic Focus
              </label>
              <select
                value={filters.geographicFocus}
                onChange={(e) => handleFilterChange('geographicFocus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Regions</option>
                <option value="north">North India</option>
                <option value="south">South India</option>
                <option value="east">East India</option>
                <option value="west">West India</option>
                <option value="global">Global</option>
              </select>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredInvestors.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{investors.length}</span> investors
          </p>
        </div>

        {/* Investors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestors.length > 0 ? (
            filteredInvestors.map(investor => (
              <InvestorCard 
                key={investor.userId} 
                investor={investor}
                onConnect={handleConnect}
                onVideoCall={handleVideoCall}
                onShowDetails={handleShowDetails}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No investors found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedInvestor && (
          <InvestorDetailModal
            investor={selectedInvestor}
            onClose={() => setShowDetailModal(false)}
            onConnect={handleConnect}
            onVideoCall={handleVideoCall}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
      </div>
    </div>
  );
};

// Investor Card Component
const InvestorCard = ({ investor, onConnect, onVideoCall, onShowDetails, formatCurrency, formatNumber }) => {
  const profile = investor.profile;
  const user = profile?.user || {};
  const stats = profile?.investmentStats || {};

  const getSubscriptionBadge = (isSubscribed) => {
    return isSubscribed ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Premium Investor
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Verified Investor
      </span>
    );
  };

  // Get top investment sectors
  const topSectors = Object.entries(stats.sectorBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([sector]) => sector);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase() || investor.name?.charAt(0).toUpperCase() || 'I'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {user.name || investor.name}
            </h3>
            <p className="text-gray-500 text-sm truncate mb-2">
              {user.email || investor.email}
            </p>
            <div className="flex items-center space-x-2">
              {getSubscriptionBadge(user.isSubscribed)}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Stats */}
      {stats.totalInvestments > 0 && (
        <div className="space-y-3 mb-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 rounded-lg p-2">
              <span className="text-blue-600 font-medium block">Total Invested</span>
              <span className="text-gray-900 font-semibold">{formatCurrency(stats.totalInvested)}</span>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <span className="text-green-600 font-medium block">Startups Funded</span>
              <span className="text-gray-900 font-semibold">{stats.uniqueStartups || 0}</span>
            </div>
          </div>

          {/* Investment Sectors */}
          {topSectors.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Top Sectors:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {topSectors.map(sector => (
                  <span key={sector} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                    {sector}
                  </span>
                ))}
                {Object.keys(stats.sectorBreakdown || {}).length > 2 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    +{Object.keys(stats.sectorBreakdown).length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity Indicator */}
          {stats.recentInvestments?.length > 0 && (
            <div className="flex items-center text-xs text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active in last 30 days
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button 
          onClick={() => onConnect(investor.userId)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
        
        <button 
          onClick={() => onVideoCall(investor.userId)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Call
        </button>

        <button 
          onClick={() => onShowDetails(investor)}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Details
        </button>
      </div>
    </div>
  );
};

// Investor Detail Modal Component
const InvestorDetailModal = ({ investor, onClose, onConnect, onVideoCall, formatCurrency, formatNumber }) => {
  const profile = investor.profile;
  const user = profile?.user || {};
  const stats = profile?.investmentStats || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {user.name?.charAt(0).toUpperCase() || investor.name?.charAt(0).toUpperCase() || 'I'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name || investor.name}</h2>
              <p className="text-gray-600">{user.email || investor.email}</p>
              <div className="mt-1">
                {user.isSubscribed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Premium Investor
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified Investor
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Investment Overview */}
          {stats.totalInvestments > 0 && (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricBox
                  label="Total Investment"
                  value={formatCurrency(stats.totalInvested)}
                  icon="💰"
                  color="blue"
                />
                <MetricBox
                  label="Number of Investments"
                  value={stats.totalInvestments}
                  icon="📊"
                  color="green"
                />
                <MetricBox
                  label="Unique Startups"
                  value={stats.uniqueStartups}
                  icon="🏢"
                  color="purple"
                />
                <MetricBox
                  label="Average Investment"
                  value={formatCurrency(stats.avgInvestmentSize)}
                  icon="📈"
                  color="orange"
                />
              </div>

              {/* Investment Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Largest Investment</h4>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.largestInvestment)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Smallest Investment</h4>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.smallestInvestment)}</p>
                </div>
              </div>

              {/* Sector Breakdown */}
              {stats.sectorBreakdown && Object.keys(stats.sectorBreakdown).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Investment Sectors</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.sectorBreakdown).map(([sector, count]) => (
                      <div key={sector} className="bg-indigo-50 rounded-lg px-4 py-2">
                        <span className="text-indigo-700 font-medium">{sector}</span>
                        <span className="text-indigo-600 text-sm ml-2">({count} {count === 1 ? 'startup' : 'startups'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Investments */}
              {stats.recentInvestments?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Investments</h3>
                  <div className="space-y-3">
                    {stats.recentInvestments.map((inv, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{inv.startupName}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(inv.amount)} • {inv.fundingType}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(inv.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* No Investment History */}
          {(!stats.totalInvestments || stats.totalInvestments === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Investment History Yet</h3>
              <p className="text-gray-600">This investor hasn't made any investments yet.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={() => onConnect(investor.userId)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send Message
            </button>
            
            <button 
              onClick={() => onVideoCall(investor.userId)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Schedule Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Box Component
const MetricBox = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium opacity-75">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default BrowseInvestorsPage;