import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';

const SubscriptionPage = () => {
  const { investor_id, startup_id, admin_id } = useParams();
  const navigate = useNavigate();
  const userId = investor_id || startup_id || admin_id;
  const userRole = investor_id ? 'investor' : startup_id ? 'startup' : 'admin';
  
  const { plans, createSubscription, validatePayment, subscription, fetchUserSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserSubscription(userId);
    }
  }, [userId, fetchUserSubscription]);

  const handleSubscribe = async (planId) => {
    try {
      setLoading(true);
      setSelectedPlan(planId);
      setError('');

      console.log('🔄 Starting REAL subscription process for plan:', planId);

      // Create REAL subscription order
      const response = await createSubscription(userId, planId);
      const { order, plan } = response.data;

      console.log('✅ REAL Order created:', order);

      // Check if Razorpay is available
      if (!window.Razorpay) {
        throw new Error('Razorpay payment gateway not loaded. Please refresh the page.');
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_WwmlF1M46ivOUV";
      
      console.log('🔑 Using Razorpay key:', razorpayKey);

      // Razorpay options
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "StartupConnect Pro",
        description: `${plan.name} Subscription`,
        image: "https://cdn.razorpay.com/logos/7K3b6d18wHwKzL_medium.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            console.log('💰 Payment successful!', response);
            
            const validation = await validatePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userId
            });

            if (validation.success) {
              alert('🎉 Subscription activated successfully!');
              fetchUserSubscription(userId);
              navigate(`/${userRole}/${userId}/dashboard`);
            } else {
              alert('❌ Payment validation failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment validation error:', error);
            alert('❌ Payment validation failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || 'Test User',
          email: localStorage.getItem('userEmail') || 'test@example.com',
          contact: '9999999999'
        },
        notes: {
          address: "StartupConnect Office",
          userId: userId
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            console.log('Checkout closed by user');
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      console.log('🎯 Opening Razorpay checkout...');
      
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('💳 Payment failed:', response.error);
        const errorMessage = response.error.description || 'Payment failed. Please try again.';
        setError(errorMessage);
        alert(`Payment failed: ${errorMessage}`);
      });
      
      rzp.open();
      
    } catch (error) {
      console.error('❌ Subscription error:', error);
      setError(error.message);
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic': return 'border-gray-300';
      case 'premium': return 'border-blue-500 border-2';
      case 'enterprise': return 'border-purple-500';
      default: return 'border-gray-300';
    }
  };

  const getButtonColor = (planId) => {
    switch (planId) {
      case 'basic': return 'bg-gray-600 hover:bg-gray-700';
      case 'premium': return 'bg-blue-600 hover:bg-blue-700';
      case 'enterprise': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (!plans.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock powerful features to grow your {userRole} business. 
          </p>

          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        {/* Current Subscription Banner */}
        {subscription && subscription.status === 'active' && (
          <div className="max-w-2xl mx-auto mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  ✅ Active Subscription
                </h3>
                <p className="text-green-700">
                  You're currently on the <strong>{subscription.plan}</strong> plan. 
                  {subscription.currentPeriodEnd && (
                    <> Your subscription will renew on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.</>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate(`/${userRole}/${userId}/dashboard`)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 ${getPlanColor(plan.id)} ${
                plan.popular ? 'relative ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={(loading && selectedPlan === plan.id) || (subscription?.status === 'active' && subscription?.plan === plan.id)}
                  className={`w-full ${getButtonColor(plan.id)} text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : subscription?.status === 'active' && subscription?.plan === plan.id ? (
                    'Current Plan'
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Test Instructions */}
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💳 Test Payment Instructions
          </h3>
          <ul className="text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Card Number:</strong> 4111 1111 1111 1111</li>
            <li><strong>Expiry Date:</strong> Any future date (e.g., 12/30)</li>
            <li><strong>CVV:</strong> 123</li>
            <li><strong>Name:</strong> Any name</li>
          </ul>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. 
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                All plans come with a 7-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, and net banking.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;