// components/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import AdditionalInfoForm from './AdditionalInfoForm';

const ProfileModal = ({ isOpen, onClose, userId }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);
  const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [loadingAdditionalInfo, setLoadingAdditionalInfo] = useState(false);
  
  const { subscription, fetchUserSubscription } = useSubscription();
  const { investor_id, admin_id, startup_id } = useParams();
  const navigate = useNavigate();
  
  const currentUserId = investor_id || admin_id || startup_id || userId;

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
      if (userId) {
        fetchUserSubscription(userId);
        fetchAdditionalInfo();
      }
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    setUsingMockData(false);
    
    try {
      console.log('🔄 ProfileModal: Fetching user data for ID:', userId);
      
      const backendURLs = [
        `http://localhost:5001/api/users/${userId}`,
        `http://localhost:3001/api/users/${userId}`,
        `http://localhost:8001/api/users/${userId}`,
        `/api/users/${userId}`
      ];
      
      let response;
      let successUrl = null;
      
      for (const url of backendURLs) {
        try {
          console.log('🔍 Trying URL:', url);
          response = await axios.get(url, { timeout: 3000 });
          console.log('✅ Success with URL:', url);
          successUrl = url;
          break;
        } catch (err) {
          console.log('❌ Failed with URL:', url, err.message);
          continue;
        }
      }
      
      if (response && response.data) {
        setUserData(response.data);
        console.log('✅ Real user data loaded in ProfileModal');
      } else {
        throw new Error('All backend URLs failed');
      }
      
    } catch (err) {
      console.error('❌ API Error, using mock data:', err);
      
      let role = 'investor';
      let name = 'Demo Investor';
      let domain = undefined;

      if (window.location.pathname.includes('/admin/')) {
        role = 'admin';
        name = 'Demo Admin';
      } else if (window.location.pathname.includes('/startup/')) {
        role = 'startup';
        name = 'Demo Startup';
        domain = 'Technology';
      }

      const mockUserData = {
        _id: userId,
        name: name,
        email: `${userId}@example.com`,
        role: role,
        isSubscribed: false,
        createdAt: new Date().toISOString(),
        domain: domain,
        subscription: {
          plan: 'basic',
          status: 'pending',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        }
      };
      
      setUserData(mockUserData);
      setUsingMockData(true);
      setError('Using demo data - Backend not connected');
    } finally {
      setLoading(false);
    }
  };

const fetchAdditionalInfo = async () => {
  setLoadingAdditionalInfo(true);
  try {
    console.log('🔍 Fetching additional info for user:', userId);
    
    // Try backend API first
    try {
      const response = await axios.get(`http://localhost:5001/api/additional-info/${userId}`);
      console.log('✅ Backend response:', response.data);
      
      if (response.data.success) {
        if (response.data.data) {
          console.log('✅ Loaded additional info from database');
          setAdditionalInfo(response.data.data);
        } else {
          console.log('ℹ️ No additional info found in database');
          setAdditionalInfo(null);
        }
        return;
      }
    } catch (apiError) {
      // Handle 404 specifically - it means no data found, which is OK
      if (apiError.response?.status === 404) {
        console.log('ℹ️ No additional info found (404)');
        setAdditionalInfo(null);
        return;
      }
      
      console.log('❌ Database fetch failed, trying localStorage:', apiError.message);
      
      // Only proceed to localStorage if it's NOT a 404
      if (apiError.response?.status !== 404) {
        // Fallback to localStorage
        const localData = JSON.parse(localStorage.getItem('additionalInfo') || '{}');
        const userAdditionalInfo = localData[userId];
        
        if (userAdditionalInfo) {
          console.log('✅ Loaded additional info from localStorage');
          setAdditionalInfo(userAdditionalInfo);
        } else {
          console.log('ℹ️ No additional info found anywhere');
          setAdditionalInfo(null);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching additional info:', error);
    setAdditionalInfo(null);
  } finally {
    setLoadingAdditionalInfo(false);
  }
};
const handleAdditionalInfoSubmit = async (formData) => {
  try {
    console.log('🔄 Submitting additional info for user:', userId);
    console.log('📤 Clean form data received:', formData);

    // Validate the form data more thoroughly
    if (!formData || typeof formData !== 'object') {
      throw new Error('Invalid form data received');
    }

    // Check if form data is corrupted (contains HTML)
    const formDataString = JSON.stringify(formData);
    if (formDataString.includes('<!DOCTYPE') || formDataString.includes('<html')) {
      console.error('❌ Form data is corrupted with HTML');
      throw new Error('Form data appears to be corrupted. Please try again.');
    }

    // Check if we have the minimum required data
    if (Object.keys(formData).length === 0) {
      throw new Error('No form data provided');
    }

    // Prepare the data for backend
    const submissionData = {
      userId: userId,
      role: userData?.role || 'investor',
      ...formData
    };

    console.log('📦 Final submission data:', submissionData);

    // Send to backend API
    const response = await axios.post('http://localhost:5001/api/additional-info', submissionData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Backend response:', response.data);

    if (response.data.success) {
      setAdditionalInfo(response.data.data);
      setShowAdditionalInfoForm(false);
      
      setError('✅ Additional information saved successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      throw new Error(response.data.message || 'Failed to save data');
    }
    
  } catch (error) {
    console.error('❌ Error saving additional info:', error);
    
    let errorMessage = 'Failed to save additional information. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = `Failed to save: ${error.response.data.message}`;
    } else if (error.message) {
      errorMessage = `Failed to save: ${error.message}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
    }
    
    setError(errorMessage);
  }
};

// Helper function for profile completion
const calculateProfileCompletion = (formData, role) => {
  if (!formData) return 0;
  
  const requiredFields = {
    startup: ['businessStage', 'fundingStage', 'teamSize', 'location', 'description'],
    investor: ['investmentStage', 'checkSize', 'location', 'investmentFocus', 'investmentPhilosophy']
  };

  const fields = requiredFields[role] || [];
  let completed = 0;

  fields.forEach(field => {
    const value = formData[field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) completed++;
      } else {
        completed++;
      }
    }
  });

  return Math.round((completed / fields.length) * 100);
};



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const handleSubscriptionToggle = async () => {
    try {
      const newSubscriptionStatus = !userData.isSubscribed;
      
      setUserData(prev => ({
        ...prev,
        isSubscribed: newSubscriptionStatus
      }));

      if (!usingMockData) {
        try {
          const response = await axios.put(`/api/users/${userId}/subscription`, {
            isSubscribed: newSubscriptionStatus
          });
          setUserData(response.data);
        } catch (apiError) {
          console.error('Failed to update subscription via API:', apiError);
          setError('Subscription updated locally only');
        }
      }
      
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Failed to update subscription');
      setUserData(prev => ({
        ...prev,
        isSubscribed: !prev.isSubscribed
      }));
    }
  };

  const handleManageSubscription = () => {
    const role = userData?.role || 'investor';
    const userId = userData?._id || currentUserId;
    navigate(`/${role}/${userId}/subscription`);
    onClose();
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan) => {
    switch (plan) {
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return 'Basic';
    }
  };

  const getSubscriptionStatus = () => {
    if (!userData) return 'inactive';
    
    if (subscription) {
      return subscription.status;
    }
    
    return userData.isSubscribed ? 'active' : 'inactive';
  };

  const isSubscriptionActive = getSubscriptionStatus() === 'active';

  // Render Additional Info Section based on user role
// In ProfileModal.jsx - Update the renderAdditionalInfoSection function

// Render Additional Info Section based on user role
const renderAdditionalInfoSection = () => {
  if (userData?.role === 'startup') {
    return (
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold">Startup Information</h4>
          <button
            onClick={() => setShowAdditionalInfoForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
          >
            {additionalInfo ? 'Edit Info' : 'Add Startup Info'}
          </button>
        </div>
        
        {loadingAdditionalInfo ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : additionalInfo ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Business Stage</label>
                <p className="text-gray-900 capitalize">{additionalInfo.businessStage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Funding Stage</label>
                <p className="text-gray-900 capitalize">{additionalInfo.fundingStage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Team Size</label>
                <p className="text-gray-900">{additionalInfo.teamSize} members</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Industry</label>
                <p className="text-gray-900 capitalize">{additionalInfo.industry}</p>
              </div>
            </div>

            {/* Financial Information */}
            {(additionalInfo.revenue || additionalInfo.mrr || additionalInfo.monthlyBurnRate) && (
              <div className="border-t pt-3">
                <h5 className="font-medium text-gray-700 mb-2">Financial Information</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {additionalInfo.revenue && (
                    <div>
                      <label className="text-xs text-gray-500">Annual Revenue</label>
                      <p className="text-gray-900">${additionalInfo.revenue.toLocaleString()}</p>
                    </div>
                  )}
                  {additionalInfo.mrr && (
                    <div>
                      <label className="text-xs text-gray-500">Monthly Revenue</label>
                      <p className="text-gray-900">${additionalInfo.mrr.toLocaleString()}</p>
                    </div>
                  )}
                  {additionalInfo.monthlyBurnRate && (
                    <div>
                      <label className="text-xs text-gray-500">Monthly Burn</label>
                      <p className="text-gray-900">${additionalInfo.monthlyBurnRate.toLocaleString()}</p>
                    </div>
                  )}
                  {additionalInfo.runway && (
                    <div>
                      <label className="text-xs text-gray-500">Runway</label>
                      <p className="text-gray-900">{additionalInfo.runway} months</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Details */}
            {additionalInfo.description && (
              <div className="border-t pt-3">
                <label className="text-sm font-medium text-gray-500">Business Description</label>
                <p className="text-gray-900 text-sm mt-1">{additionalInfo.description}</p>
              </div>
            )}

            {additionalInfo.website && (
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <p className="text-gray-900 break-all text-sm">{additionalInfo.website}</p>
              </div>
            )}

            {/* Profile Completion */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Profile Completion</span>
                <span className="font-semibold text-blue-600">
                  {calculateProfileCompletion(additionalInfo, 'startup')}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProfileCompletion(additionalInfo, 'startup')}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">🏢</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Startup Profile</h4>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Add detailed information about your startup to attract better investor matches and opportunities.
            </p>
            <button
              onClick={() => setShowAdditionalInfoForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition duration-200 font-medium"
            >
              Start Setup - 5 Steps
            </button>
          </div>
        )}
      </div>
    );
  }

  if (userData?.role === 'investor') {
    return (
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold">Investor Profile</h4>
          <button
            onClick={() => setShowAdditionalInfoForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
          >
            {additionalInfo ? 'Edit Profile' : 'Add Investor Info'}
          </button>
        </div>
        
        {loadingAdditionalInfo ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : additionalInfo ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Investment Stage</label>
                <p className="text-gray-900 capitalize">{additionalInfo.investmentStage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Check Size</label>
                <p className="text-gray-900">${additionalInfo.checkSize?.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Portfolio Size</label>
                <p className="text-gray-900">{additionalInfo.portfolioSize} companies</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Years Investing</label>
                <p className="text-gray-900">{additionalInfo.yearsInvesting} years</p>
              </div>
            </div>

            {/* Investment Focus */}
            {additionalInfo.investmentFocus && additionalInfo.investmentFocus.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Investment Focus</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {additionalInfo.investmentFocus.map(focus => (
                    <span key={focus} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                      {focus.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Investment Philosophy */}
            {additionalInfo.investmentPhilosophy && (
              <div>
                <label className="text-sm font-medium text-gray-500">Investment Philosophy</label>
                <p className="text-gray-900 text-sm mt-1">{additionalInfo.investmentPhilosophy}</p>
              </div>
            )}

            {/* Profile Completion */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Profile Completion</span>
                <span className="font-semibold text-blue-600">
                  {calculateProfileCompletion(additionalInfo, 'investor')}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProfileCompletion(additionalInfo, 'investor')}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">👤</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Investor Profile</h4>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Add detailed information about your investment preferences to get better startup matches and deal flow.
            </p>
            <button
              onClick={() => setShowAdditionalInfoForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition duration-200 font-medium"
            >
              Start Setup - 5 Steps
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {usingMockData && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                <p className="text-yellow-800 text-sm text-center">
                  ⚠️ Using demo data - Backend connection required for real data
                </p>
              </div>
            )}

            {error && !usingMockData && !error.includes('successfully') && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </div>
            )}

            {error && error.includes('successfully') && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg">
                <p className="text-green-800 text-sm text-center">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <span className="text-gray-600">Loading profile data...</span>
              </div>
            ) : error && !usingMockData && !error.includes('successfully') ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchUserData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : userData ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-semibold">
                      {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{userData.name}</h3>
                    <p className="text-gray-600 capitalize">{userData.role}</p>
                    {usingMockData && (
                      <p className="text-xs text-yellow-600">Demo Profile</p>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{userData.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-gray-900 text-sm font-mono bg-gray-100 p-2 rounded truncate">
                        {userData._id}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined Date</label>
                    <p className="text-gray-900">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Domain (for startups) */}
                  {userData.role === 'startup' && userData.domain && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Domain</label>
                      <p className="text-gray-900 capitalize">{userData.domain}</p>
                    </div>
                  )}
                </div>

                {/* Additional Information Section */}
                {renderAdditionalInfoSection()}

                {/* Subscription Status */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold mb-3">Subscription Status</h4>
                  
                  {/* Current Plan */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700">Current Plan</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      getPlanColor(subscription?.plan || userData.subscription?.plan || 'basic')
                    }`}>
                      {getPlanName(subscription?.plan || userData.subscription?.plan || 'basic')}
                    </span>
                  </div>

                  {/* Subscription Status */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isSubscriptionActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isSubscriptionActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Newsletter Subscription */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700">Newsletter</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      userData.isSubscribed 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userData.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                    </span>
                  </div>

                  {/* Subscription End Date */}
                  {(subscription?.currentPeriodEnd || userData.subscription?.currentPeriodEnd) && (
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <span className="text-gray-600">
                        {subscription?.cancelAtPeriodEnd ? 'Expires on' : 'Renews on'}
                      </span>
                      <span className="text-gray-900">
                        {new Date(subscription?.currentPeriodEnd || userData.subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Newsletter Toggle */}
                  <button
                    onClick={handleSubscriptionToggle}
                    className={`w-full py-2 px-4 rounded-lg transition duration-200 mb-3 ${
                      userData.isSubscribed
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {userData.isSubscribed ? 'Unsubscribe from Newsletter' : 'Subscribe to Newsletter'}
                  </button>

                  {/* Subscription Management Buttons */}
                  <div className="space-y-2">
                    {!isSubscriptionActive ? (
                      <button
                        onClick={handleManageSubscription}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 text-center"
                      >
                        Upgrade Your Plan
                      </button>
                    ) : (
                      <button
                        onClick={handleManageSubscription}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200 text-center"
                      >
                        Manage Subscription
                      </button>
                    )}
                  </div>

                  {usingMockData && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Changes are saved locally only
                    </p>
                  )}
                </div>

                {/* Account Management */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold mb-3">Account Management</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Edit Profile</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Privacy Settings</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Notification Preferences</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Role-specific Information */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold mb-3">
                    {userData.role === 'investor' && 'Investor Features'}
                    {userData.role === 'startup' && 'Startup Features'}
                    {userData.role === 'admin' && 'Admin Features'}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {userData.role === 'investor' && (
                      <>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Access to startup portfolios and analytics
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Investment opportunity tracking
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Direct communication with startups
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Portfolio performance insights
                        </p>
                      </>
                    )}
                    
                    {userData.role === 'startup' && (
                      <>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Showcase your business to investors
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Access to investor network
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Funding and growth opportunities
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Business analytics and metrics
                        </p>
                      </>
                    )}
                    
                    {userData.role === 'admin' && (
                      <>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          Platform management and moderation
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          User account administration
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          System analytics and reporting
                        </p>
                        <p className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          Content and user moderation tools
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold mb-3">Usage Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">12</p>
                      <p className="text-gray-600">Active Projects</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">85%</p>
                      <p className="text-gray-600">Profile Complete</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={() => window.open('/help', '_blank')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help</span>
              </button>
              
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Form Modal */}
      {showAdditionalInfoForm && (
        <AdditionalInfoForm
          userRole={userData?.role}
          existingData={additionalInfo}
          onSubmit={handleAdditionalInfoSubmit}
          onClose={() => setShowAdditionalInfoForm(false)}
        />
      )}
    </>
  );
};

export default ProfileModal;