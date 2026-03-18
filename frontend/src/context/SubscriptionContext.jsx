import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  // All API calls go to the main server on port 5001
  const API_BASE_URL = 'http://localhost:5001/api';

  const fallbackPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 299,
      currency: 'INR',
      period: 'month',
      features: ['Access to basic startup profiles', 'Limited messaging', 'Basic analytics', 'Email support'],
      color: 'gray',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium', 
      price: 799,
      currency: 'INR',
      period: 'month',
      features: ['Full startup profile access', 'Unlimited messaging', 'Advanced analytics', 'Priority support', 'Video calls'],
      color: 'blue',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1999,
      currency: 'INR', 
      period: 'month',
      features: ['All Premium features', 'Dedicated manager', 'Custom reporting', 'API access', '24/7 support'],
      color: 'purple',
      popular: false
    }
  ];

  useEffect(() => {
    setPlans(fallbackPlans);
    fetchPlansFromAPI();
  }, []);

  const fetchPlansFromAPI = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/plans`);
      if (response.data.success) {
        setPlans(response.data.data.plans);
      }
    } catch (error) {
      console.log('Using fallback plans - API not available');
    }
  };

  const createSubscription = async (userId, planId) => {
    try {
      console.log('🔄 Creating subscription order...');
      
      const response = await axios.post(`${API_BASE_URL}/subscriptions/create-order`, {
        userId,
        plan: planId
      }, {
        timeout: 15000
      });

      console.log('✅ Order created successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      
      throw new Error(
        error.response?.data?.message || 
        'Failed to create subscription order. Please try again.'
      );
    }
  };

  const validatePayment = async (paymentData) => {
    try {
      console.log('🔐 Validating payment...');
      const response = await axios.post(`${API_BASE_URL}/subscriptions/validate-payment`, paymentData, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Payment validation error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Payment validation failed. Please contact support.'
      );
    }
  };

  const fetchUserSubscription = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/subscriptions/user/${userId}`);
      if (response.data.success && response.data.data) {
        setSubscription(response.data.data);
      }
    } catch (error) {
      console.log('Could not fetch user subscription');
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscriptions/cancel`, { subscriptionId });
      setSubscription(response.data.data);
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const value = {
    subscription,
    plans,
    loading,
    fetchUserSubscription,
    createSubscription,
    validatePayment,
    cancelSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};