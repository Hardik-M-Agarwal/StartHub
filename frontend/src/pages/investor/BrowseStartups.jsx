import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BrowseStartupsPage = () => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    industry: '',
    businessStage: '',
    fundingStage: '',
    teamSize: ''
  });
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  // Fetch all startups with complete profiles
  const fetchStartups = async () => {
    try {
      setLoading(true);
      
      const usersResponse = await fetch('http://localhost:5001/api/users/chat/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersResult = await usersResponse.json();
      
      if (usersResult.success) {
        const startupUsers = usersResult.data.users.filter(user => user.role === 'startup');
        
        const startupsWithDetails = await Promise.all(
          startupUsers.map(async (startup) => {
            try {
              // Fetch complete startup profile
              const profileResponse = await fetch(`http://localhost:5001/api/startups/profile/${startup.userId}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                return {
                  ...startup,
                  profile: profileData.data
                };
              }
              return { ...startup, profile: null };
            } catch (error) {
              console.error(`Error fetching profile for ${startup.userId}:`, error);
              return { ...startup, profile: null };
            }
          })
        );
        
        setStartups(startupsWithDetails);
      } else {
        throw new Error(usersResult.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching startups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  // Filter startups based on search and filters
  const filteredStartups = startups.filter(startup => {
    const profile = startup.profile;
    const user = profile?.user || {};
    const additionalInfo = profile?.additionalInfo || {};
    const fundingStats = profile?.fundingStats || {};
    const growthMetrics = profile?.growthMetrics?.current || {};

    // Search in name, email, industry, and description
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      additionalInfo.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      additionalInfo.targetMarket?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      additionalInfo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = !filters.industry || additionalInfo.industry === filters.industry;
    const matchesBusinessStage = !filters.businessStage || additionalInfo.businessStage === filters.businessStage;
    const matchesFundingStage = !filters.fundingStage || additionalInfo.fundingStage === filters.fundingStage;
    const matchesTeamSize = !filters.teamSize || 
      (filters.teamSize === '1-10' && (additionalInfo.teamSize <= 10 || growthMetrics.totalUsers <= 10)) ||
      (filters.teamSize === '11-50' && ((additionalInfo.teamSize > 10 && additionalInfo.teamSize <= 50) || 
        (growthMetrics.totalUsers > 10 && growthMetrics.totalUsers <= 50))) ||
      (filters.teamSize === '50+' && ((additionalInfo.teamSize > 50) || growthMetrics.totalUsers > 50));

    return matchesSearch && matchesIndustry && matchesBusinessStage && matchesFundingStage && matchesTeamSize;
  });

  // Get unique values for filters from actual data
  const industries = [...new Set(
    startups.map(s => s.profile?.additionalInfo?.industry).filter(Boolean)
  )];

  const businessStages = [...new Set(
    startups.map(s => s.profile?.additionalInfo?.businessStage).filter(Boolean)
  )];

  const fundingStages = [...new Set(
    startups.map(s => s.profile?.additionalInfo?.fundingStage).filter(Boolean)
  )];

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      industry: '',
      businessStage: '',
      fundingStage: '',
      teamSize: ''
    });
    setSearchTerm('');
  };

  const handleConnect = (startupId) => {
    navigate(`/chat?user=${startupId}`);
  };

  const handleVideoCall = async (startupId) => {
    try {
      const response = await fetch('http://localhost:5001/api/call/generate-room');
      const result = await response.json();
      
      if (result.success) {
        navigate(`/call/${result.data.roomId}?targetUser=${startupId}`);
      }
    } catch (error) {
      console.error('Error generating call room:', error);
    }
  };

  const handleShowDetails = (startup) => {
    setSelectedStartup(startup);
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

  // Format percentage
  const formatPercentage = (num) => {
    if (!num) return 'N/A';
    return `${num}%`;
  };

  // Format enum values for display
  const formatEnumValue = (value) => {
    if (!value) return '';
    return value.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading startups...</p>
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
            onClick={fetchStartups}
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
            Browse Startups
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover innovative startups with verified growth metrics and funding history
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
                placeholder="Search startups by name, industry, or target market..."
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
                Industry
              </label>
              <select
                value={filters.industry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {formatEnumValue(industry)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Stage
              </label>
              <select
                value={filters.businessStage}
                onChange={(e) => handleFilterChange('businessStage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Stages</option>
                {businessStages.map(stage => (
                  <option key={stage} value={stage}>
                    {formatEnumValue(stage)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Stage
              </label>
              <select
                value={filters.fundingStage}
                onChange={(e) => handleFilterChange('fundingStage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Funding</option>
                {fundingStages.map(stage => (
                  <option key={stage} value={stage}>
                    {formatEnumValue(stage)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size
              </label>
              <select
                value={filters.teamSize}
                onChange={(e) => handleFilterChange('teamSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Any Size</option>
                <option value="1-10">1-10 people</option>
                <option value="11-50">11-50 people</option>
                <option value="50+">50+ people</option>
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
            Showing <span className="font-semibold text-gray-900">{filteredStartups.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{startups.length}</span> startups
          </p>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.length > 0 ? (
            filteredStartups.map(startup => (
              <StartupCard 
                key={startup.userId} 
                startup={startup}
                onConnect={handleConnect}
                onVideoCall={handleVideoCall}
                onShowDetails={handleShowDetails}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatPercentage={formatPercentage}
                formatEnumValue={formatEnumValue}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No startups found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedStartup && (
          <StartupDetailModal
            startup={selectedStartup}
            onClose={() => setShowDetailModal(false)}
            onConnect={handleConnect}
            onVideoCall={handleVideoCall}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            formatEnumValue={formatEnumValue}
          />
        )}
      </div>
    </div>
  );
};

// Startup Card Component
const StartupCard = ({ startup, onConnect, onVideoCall, onShowDetails, formatCurrency, formatNumber, formatPercentage, formatEnumValue }) => {
  const profile = startup.profile;
  const user = profile?.user || {};
  const additionalInfo = profile?.additionalInfo || {};
  const fundingStats = profile?.fundingStats || {};
  const growthMetrics = profile?.growthMetrics?.current || {};

  const getSubscriptionBadge = (isSubscribed) => {
    return isSubscribed ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Premium
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Verified
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase() || startup.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {user.name || startup.name}
            </h3>
            <p className="text-gray-500 text-sm truncate mb-2">
              {additionalInfo.industry || user.domain || 'Startup'}
            </p>
            <div className="flex items-center space-x-2">
              {getSubscriptionBadge(user.isSubscribed)}
              {additionalInfo.businessStage && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {formatEnumValue(additionalInfo.businessStage)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3 mb-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {fundingStats.totalFundingRaised > 0 && (
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <span className="text-green-600 text-xs font-medium">Raised</span>
              <p className="text-green-700 font-semibold text-sm">
                {formatCurrency(fundingStats.totalFundingRaised)}
              </p>
            </div>
          )}
          
          {growthMetrics.revenue > 0 && (
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <span className="text-blue-600 text-xs font-medium">Revenue</span>
              <p className="text-blue-700 font-semibold text-sm">
                {formatCurrency(growthMetrics.revenue)}
              </p>
            </div>
          )}
          
          {growthMetrics.totalUsers > 0 && (
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <span className="text-purple-600 text-xs font-medium">Users</span>
              <p className="text-purple-700 font-semibold text-sm">
                {formatNumber(growthMetrics.totalUsers)}
              </p>
            </div>
          )}
          
          {fundingStats.totalInvestors > 0 && (
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <span className="text-orange-600 text-xs font-medium">Investors</span>
              <p className="text-orange-700 font-semibold text-sm">
                {fundingStats.totalInvestors}
              </p>
            </div>
          )}
        </div>

        {/* Growth Indicator */}
        {profile?.growthMetrics?.trends?.revenueGrowth && (
          <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-2">
            <span className="text-gray-600">Revenue Growth</span>
            <span className={`font-semibold ${
              parseFloat(profile.growthMetrics.trends.revenueGrowth) > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {profile.growthMetrics.trends.revenueGrowth > 0 ? '↑' : '↓'} 
              {Math.abs(profile.growthMetrics.trends.revenueGrowth)}%
            </span>
          </div>
        )}

        {/* Location */}
        {additionalInfo.location && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {additionalInfo.location}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button 
          onClick={() => onConnect(startup.userId)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
        
        <button 
          onClick={() => onVideoCall(startup.userId)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Call
        </button>

        <button 
          onClick={() => onShowDetails(startup)}
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

// Startup Detail Modal Component
const StartupDetailModal = ({ startup, onClose, onConnect, onVideoCall, formatCurrency, formatNumber, formatPercentage, formatEnumValue }) => {
  const profile = startup.profile;
  const user = profile?.user || {};
  const additionalInfo = profile?.additionalInfo || {};
  const fundingStats = profile?.fundingStats || {};
  const growthMetrics = profile?.growthMetrics?.current || {};
  const trends = profile?.growthMetrics?.trends || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {user.name?.charAt(0).toUpperCase() || startup.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name || startup.name}</h2>
              <p className="text-gray-600">{additionalInfo.industry || user.domain || 'Startup'}</p>
              <div className="mt-1 flex space-x-2">
                {user.isSubscribed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Premium Startup
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified Startup
                  </span>
                )}
                {additionalInfo.businessStage && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {formatEnumValue(additionalInfo.businessStage)}
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
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricBox
              label="Total Funding"
              value={formatCurrency(fundingStats.totalFundingRaised)}
              icon="💰"
              color="green"
            />
            <MetricBox
              label="Monthly Revenue"
              value={formatCurrency(growthMetrics.revenue)}
              icon="📈"
              color="blue"
            />
            <MetricBox
              label="Total Users"
              value={formatNumber(growthMetrics.totalUsers)}
              icon="👥"
              color="purple"
            />
            <MetricBox
              label="Team Size"
              value={additionalInfo.teamSize || growthMetrics.totalUsers || 'N/A'}
              icon="👤"
              color="orange"
            />
          </div>

          {/* Growth Trends */}
          {Object.keys(trends).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trends.revenueGrowth && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Revenue Growth</p>
                  <p className={`text-lg font-bold ${
                    parseFloat(trends.revenueGrowth) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trends.revenueGrowth > 0 ? '+' : ''}{trends.revenueGrowth}%
                  </p>
                </div>
              )}
              {trends.userGrowth && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">User Growth</p>
                  <p className={`text-lg font-bold ${
                    parseFloat(trends.userGrowth) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trends.userGrowth > 0 ? '+' : ''}{trends.userGrowth}%
                  </p>
                </div>
              )}
              {growthMetrics.retentionRate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPercentage(growthMetrics.retentionRate)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Business Description */}
          {additionalInfo.description && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{additionalInfo.description}</p>
              </div>
            </section>
          )}

          {/* Funding History */}
          {fundingStats.recentRounds?.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Funding History</h3>
              <div className="space-y-3">
                {fundingStats.recentRounds.map((round, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-green-800">
                          {formatCurrency(round.amount)} • {formatEnumValue(round.fundingType)}
                        </p>
                        <p className="text-sm text-green-600">
                          From {round.investorName || 'Investor'}
                        </p>
                        {round.equityPercentage && (
                          <p className="text-xs text-green-500 mt-1">
                            Equity: {round.equityPercentage}%
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-green-600">
                        {new Date(round.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Target Market */}
          {additionalInfo.targetMarket && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Target Market</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800">{additionalInfo.targetMarket}</p>
              </div>
            </section>
          )}

          {/* Competitive Advantage */}
          {additionalInfo.competitiveAdvantage && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Advantage</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-800">{additionalInfo.competitiveAdvantage}</p>
              </div>
            </section>
          )}

          {/* Growth Strategy */}
          {additionalInfo.growthStrategy && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Growth Strategy</h3>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-orange-800">{additionalInfo.growthStrategy}</p>
              </div>
            </section>
          )}

          {/* Business Challenges */}
          {additionalInfo.businessChallenges && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Challenges</h3>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-yellow-800">{additionalInfo.businessChallenges}</p>
              </div>
            </section>
          )}

          {/* Contact & Links */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact & Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalInfo.website && (
                <a href={additionalInfo.website} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center text-blue-600 hover:text-blue-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  Website
                </a>
              )}
              {additionalInfo.linkedinProfile && (
                <a href={additionalInfo.linkedinProfile} target="_blank" rel="noopener noreferrer"
                   className="flex items-center text-blue-600 hover:text-blue-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {additionalInfo.location && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {additionalInfo.location}
                </div>
              )}
            </div>
          </section>
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
              onClick={() => onConnect(startup.userId)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send Message
            </button>
            
            <button 
              onClick={() => onVideoCall(startup.userId)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Schedule Pitch Call
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

  if (!value || value === '0' || value === 'N/A') return null;

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

export default BrowseStartupsPage;