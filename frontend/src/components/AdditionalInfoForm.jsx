// components/AdditionalInfoForm.jsx
import React, { useState } from 'react';

const AdditionalInfoForm = ({ userRole, existingData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(() => {
    // Start with clean initial state
    const baseData = {
      // Basic Information
      location: '',
      foundedYear: new Date().getFullYear(),
      linkedinProfile: '',
      twitterProfile: '',
      website: '',
      description: '',
    };

    // Add role-specific fields
    if (userRole === 'startup') {
      Object.assign(baseData, {
        // Business Details
        businessStage: '',
        fundingStage: '',
        teamSize: '',
        businessModel: '',
        targetMarket: '',
        industry: '',
        
        // Financial Information
        revenue: '',
        monthlyBurnRate: '',
        runway: '',
        customerCount: '',
        mrr: '',
        
        // Product & Market
        keyMetrics: '',
        competitiveAdvantage: '',
        businessChallenges: '',
        
        // Team & Operations
        foundingTeam: [],
        techStack: [],
        partnerships: '',
        
        // Future Plans
        growthStrategy: '',
        fundingNeeds: '',
        exitStrategy: '',
      });
    } else if (userRole === 'investor') {
      Object.assign(baseData, {
        // Investment Preferences
        investmentFocus: [],
        investmentStage: '',
        checkSize: '',
        minInvestment: '',
        maxInvestment: '',
        typicalOwnership: '',
        
        // Portfolio & Experience
        portfolioSize: '',
        avgRoundSize: '',
        totalAum: '',
        yearsInvesting: '',
        
        // Investment Philosophy
        investmentPhilosophy: '',
        dueDiligenceProcess: '',
        valueAdd: '',
        boardSeat: false,
        leadInvestor: false,
        
        // Geographic & Industry Focus
        geographicFocus: [],
        preferredIndustries: [],
        excludedIndustries: [],
        
        // Co-investment Preferences
        coInvestors: '',
        investmentCriteria: '',
        dealFlowSource: [],
      });
    }

    // Merge with existing data if provided
    if (existingData) {
      return { ...baseData, ...existingData };
    }

    return baseData;
  });

  const [currentSection, setCurrentSection] = useState('basic');
  const [loading, setLoading] = useState(false);

  // Enhanced sections configuration for Startup
  const startupSections = {
    basic: {
      title: 'Basic Information',
      icon: '🏢',
      fields: [
        {
          name: 'businessStage',
          label: 'Business Stage',
          type: 'select',
          options: ['idea', 'prototype', 'mvp', 'early-revenue', 'scaling', 'established'],
          required: true,
          description: 'Current development stage of your business'
        },
        {
          name: 'fundingStage',
          label: 'Funding Stage',
          type: 'select',
          options: ['bootstrapped', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c-plus'],
          required: true,
          description: 'Current funding round you are seeking'
        },
        {
          name: 'teamSize',
          label: 'Team Size',
          type: 'number',
          required: true,
          description: 'Number of full-time team members'
        },
        {
          name: 'location',
          label: 'Headquarters Location',
          type: 'text',
          required: true,
          description: 'Primary office location'
        }
      ]
    },
    business: {
      title: 'Business Details',
      icon: '💼',
      fields: [
        {
          name: 'industry',
          label: 'Industry',
          type: 'select',
          options: ['technology', 'healthcare', 'fintech', 'ecommerce', 'saas', 'ai-ml', 'clean-tech', 'biotech', 'edtech', 'real-estate-tech'],
          required: true,
          description: 'Primary industry category'
        },
        {
          name: 'businessModel',
          label: 'Business Model',
          type: 'select',
          options: ['b2b', 'b2c', 'b2b2c', 'marketplace', 'subscription', 'transactional', 'freemium', 'enterprise-sales'],
          required: true,
          description: 'How your business generates revenue'
        },
        {
          name: 'targetMarket',
          label: 'Target Market',
          type: 'text',
          required: true,
          description: 'Primary customer segment or market'
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          required: false,
          description: 'Company website URL'
        }
      ]
    },
    financial: {
      title: 'Financial Information',
      icon: '💰',
      fields: [
        {
          name: 'revenue',
          label: 'Annual Revenue (USD)',
          type: 'number',
          required: false,
          description: 'If applicable, your annual revenue'
        },
        {
          name: 'mrr',
          label: 'Monthly Recurring Revenue (USD)',
          type: 'number',
          required: false,
          description: 'For subscription-based businesses'
        },
        {
          name: 'monthlyBurnRate',
          label: 'Monthly Burn Rate (USD)',
          type: 'number',
          required: false,
          description: 'Monthly operating expenses'
        },
        {
          name: 'runway',
          label: 'Cash Runway (Months)',
          type: 'number',
          required: false,
          description: 'Months of operation with current cash'
        },
        {
          name: 'customerCount',
          label: 'Number of Customers',
          type: 'number',
          required: false,
          description: 'Total active customers'
        }
      ]
    },
    product: {
      title: 'Product & Market',
      icon: '🚀',
      fields: [
        {
          name: 'description',
          label: 'Business Description',
          type: 'textarea',
          required: true,
          description: 'Detailed description of your business and product'
        },
        {
          name: 'keyMetrics',
          label: 'Key Metrics',
          type: 'textarea',
          required: false,
          description: 'Important business metrics (growth rate, churn, LTV, etc.)'
        },
        {
          name: 'competitiveAdvantage',
          label: 'Competitive Advantage',
          type: 'textarea',
          required: false,
          description: 'What makes your business unique'
        },
        {
          name: 'businessChallenges',
          label: 'Current Challenges',
          type: 'textarea',
          required: false,
          description: 'Key challenges you are facing'
        }
      ]
    },
    future: {
      title: 'Future Plans',
      icon: '🎯',
      fields: [
        {
          name: 'growthStrategy',
          label: 'Growth Strategy',
          type: 'textarea',
          required: false,
          description: 'How you plan to grow the business'
        },
        {
          name: 'fundingNeeds',
          label: 'Funding Needs (USD)',
          type: 'number',
          required: false,
          description: 'Amount of funding you are seeking'
        },
        {
          name: 'exitStrategy',
          label: 'Long-term Vision',
          type: 'select',
          options: ['ipo', 'acquisition', 'long-term-independence', 'merger', 'undecided'],
          required: false,
          description: 'Your vision for the company\'s future'
        }
      ]
    }
  };

  // Enhanced sections configuration for Investor
  const investorSections = {
    basic: {
      title: 'Basic Information',
      icon: '👤',
      fields: [
        {
          name: 'investmentStage',
          label: 'Preferred Investment Stage',
          type: 'select',
          options: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c-plus', 'growth', 'late-stage'],
          required: true,
          description: 'Stages you typically invest in'
        },
        {
          name: 'checkSize',
          label: 'Typical Check Size (USD)',
          type: 'number',
          required: true,
          description: 'Your standard investment amount'
        },
        {
          name: 'minInvestment',
          label: 'Minimum Investment (USD)',
          type: 'number',
          required: false,
          description: 'Smallest check you write'
        },
        {
          name: 'maxInvestment',
          label: 'Maximum Investment (USD)',
          type: 'number',
          required: false,
          description: 'Largest check you write'
        },
        {
          name: 'location',
          label: 'Based In',
          type: 'text',
          required: true,
          description: 'Your primary location'
        }
      ]
    },
    focus: {
      title: 'Investment Focus',
      icon: '🎯',
      fields: [
        {
          name: 'investmentFocus',
          label: 'Industry Focus',
          type: 'multiselect',
          options: ['technology', 'healthcare', 'fintech', 'ai-ml', 'clean-tech', 'ecommerce', 'saas', 'biotech', 'edtech', 'hardware', 'consumer-goods', 'enterprise-software'],
          required: true,
          description: 'Industries you focus on'
        },
        {
          name: 'geographicFocus',
          label: 'Geographic Focus',
          type: 'multiselect',
          options: ['north-america', 'europe', 'asia-pacific', 'latin-america', 'middle-east', 'africa', 'global'],
          required: false,
          description: 'Regions you invest in'
        },
        {
          name: 'preferredIndustries',
          label: 'Specific Industry Interests',
          type: 'textarea',
          required: false,
          description: 'More detailed industry interests'
        }
      ]
    },
    portfolio: {
      title: 'Portfolio & Experience',
      icon: '📊',
      fields: [
        {
          name: 'portfolioSize',
          label: 'Portfolio Size',
          type: 'number',
          required: false,
          description: 'Number of companies in portfolio'
        },
        {
          name: 'totalAum',
          label: 'Total AUM (USD)',
          type: 'number',
          required: false,
          description: 'Assets under management'
        },
        {
          name: 'yearsInvesting',
          label: 'Years Investing',
          type: 'number',
          required: false,
          description: 'Years of investment experience'
        },
        {
          name: 'avgRoundSize',
          label: 'Average Round Size (USD)',
          type: 'number',
          required: false,
          description: 'Typical round size you participate in'
        },
        {
          name: 'typicalOwnership',
          label: 'Typical Ownership Target',
          type: 'text',
          required: false,
          description: 'Target ownership percentage'
        }
      ]
    },
    philosophy: {
      title: 'Investment Philosophy',
      icon: '💡',
      fields: [
        {
          name: 'investmentPhilosophy',
          label: 'Investment Philosophy',
          type: 'textarea',
          required: true,
          description: 'Your overall investment approach and beliefs'
        },
        {
          name: 'dueDiligenceProcess',
          label: 'Due Diligence Process',
          type: 'textarea',
          required: false,
          description: 'How you evaluate investments'
        },
        {
          name: 'valueAdd',
          label: 'Value Add to Portfolio',
          type: 'textarea',
          required: false,
          description: 'How you help portfolio companies'
        },
        {
          name: 'investmentCriteria',
          label: 'Investment Criteria',
          type: 'textarea',
          required: false,
          description: 'Specific criteria for investments'
        }
      ]
    },
    preferences: {
      title: 'Investment Preferences',
      icon: '⚡',
      fields: [
        {
          name: 'boardSeat',
          label: 'Require Board Seat',
          type: 'radio',
          options: [
            { value: true, label: 'Yes, typically require board seat' },
            { value: false, label: 'No, board seat not required' }
          ],
          required: false,
          description: 'Do you typically require a board seat?'
        },
        {
          name: 'leadInvestor',
          label: 'Lead Investor Role',
          type: 'radio',
          options: [
            { value: true, label: 'Yes, often lead rounds' },
            { value: false, label: 'No, typically follow other investors' }
          ],
          required: false,
          description: 'Do you typically lead investment rounds?'
        },
        {
          name: 'dealFlowSource',
          label: 'Primary Deal Flow Sources',
          type: 'multiselect',
          options: ['referrals', 'cold-outreach', 'events', 'accelerators', 'other-vcs', 'founder-network', 'online-platforms'],
          required: false,
          description: 'Where you find most investment opportunities'
        },
        {
          name: 'coInvestors',
          label: 'Preferred Co-investors',
          type: 'textarea',
          required: false,
          description: 'Types of investors you like to co-invest with'
        }
      ]
    }
  };

  const sections = userRole === 'startup' ? startupSections : investorSections;
  const sectionKeys = Object.keys(sections);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Form submission started');
    
    // Validate current section
    const currentFields = sections[currentSection].fields;
    const hasErrors = currentFields.some(field => {
      if (field.required) {
        const value = formData[field.name];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return true;
        }
      }
      return false;
    });

    if (hasErrors) {
      alert('Please fill in all required fields in the current section.');
      return;
    }

    // If it's the last section, submit the form
    if (sectionKeys.indexOf(currentSection) === sectionKeys.length - 1) {
      setLoading(true);
      try {
        console.log('🚀 Submitting form data:', formData);
        
        // Create a clean copy and filter out empty values
        const submissionData = {};
        Object.keys(formData).forEach(key => {
          const value = formData[key];
          if (value !== '' && value !== null && value !== undefined) {
            if (Array.isArray(value) && value.length === 0) {
              // Skip empty arrays
              return;
            }
            submissionData[key] = value;
          }
        });

        console.log('📦 Clean submission data:', submissionData);
        await onSubmit(submissionData);
        
      } catch (error) {
        console.error('Error in form submission:', error);
        alert('Failed to save information. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Move to next section
      const currentIndex = sectionKeys.indexOf(currentSection);
      setCurrentSection(sectionKeys[currentIndex + 1]);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    console.log(`📝 Field ${fieldName} changed to:`, value);
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'select':
        return (
          <div>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => (
                <option key={option} value={option}>
                  {option.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {field.options.map(option => (
                <label key={option} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(val => val !== option);
                      handleFieldChange(field.name, newValues);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 capitalize flex-1">
                    {option.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </label>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      
      case 'number':
        return (
          <div>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value ? parseInt(e.target.value) : '')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div>
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={field.name}
                    checked={value === option.value}
                    onChange={() => handleFieldChange(field.name, option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );
    }
  };

  const progress = ((sectionKeys.indexOf(currentSection) + 1) / sectionKeys.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {userRole === 'startup' ? 'Startup Details' : 'Investor Profile'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Section {sectionKeys.indexOf(currentSection) + 1} of {sectionKeys.length}: {sections[currentSection].icon} {sections[currentSection].title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar and Steps */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mb-6">
            {sectionKeys.map((sectionKey, index) => (
              <div
                key={sectionKey}
                className={`flex flex-col items-center ${
                  index <= sectionKeys.indexOf(currentSection) ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= sectionKeys.indexOf(currentSection) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs mt-1 text-center hidden sm:block">
                  {sections[sectionKey].title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {sections[currentSection].fields.map(field => (
              <div key={field.name} className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const currentIndex = sectionKeys.indexOf(currentSection);
                if (currentIndex > 0) {
                  setCurrentSection(sectionKeys[currentIndex - 1]);
                }
              }}
              disabled={sectionKeys.indexOf(currentSection) === 0}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {sectionKeys.indexOf(currentSection) === sectionKeys.length - 1 
                        ? 'Complete Profile' 
                        : 'Next'}
                    </span>
                    {sectionKeys.indexOf(currentSection) < sectionKeys.length - 1 && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdditionalInfoForm;