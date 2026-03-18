import React, { useState } from 'react';
import { X, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

const FundRequestForm = ({ onSubmit, onClose, selectedUser, currentUser }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Details
    amount: '',
    fundingType: 'equity',
    
    // Company Details
    companyName: '',
    domain: '',
    yearOfEstablishment: '',
    teamSize: '',
    previousFunding: '0',
    
    // Funding Details
    description: '',
    useOfFunds: '',
    fundingTimeline: '',
    milestone: '',
    
    // Type-specific fields
    equityPercentage: '',
    interestRate: '',
    loanTenure: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fundingOptions = [
    { value: 'equity', label: 'Equity', color: 'blue' },
    { value: 'debt', label: 'Debt', color: 'green' },
    { value: 'grant', label: 'Grant', color: 'purple' },
    { value: 'venture_debt', label: 'Venture Debt', color: 'orange' }
  ];

  const timelineOptions = [
    { value: 'ASAP', label: 'As Soon As Possible' },
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '12_months', label: '12 Months' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.companyName.trim()) {
        setError('Company name is required');
        return false;
      }
      if (!formData.domain.trim()) {
        setError('Domain is required');
        return false;
      }
      if (!formData.yearOfEstablishment) {
        setError('Year of establishment is required');
        return false;
      }
      if (!formData.teamSize) {
        setError('Team size is required');
        return false;
      }
    } else if (step === 2) {
      if (!formData.amount) {
        setError('Funding amount is required');
        return false;
      }
      if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return false;
      }
      
      if (formData.fundingType === 'equity' && !formData.equityPercentage) {
        setError('Equity percentage is required for equity funding');
        return false;
      }
      if (formData.fundingType === 'debt') {
        if (!formData.interestRate) {
          setError('Interest rate is required for debt funding');
          return false;
        }
        if (!formData.loanTenure) {
          setError('Loan tenure is required for debt funding');
          return false;
        }
      }
    } else if (step === 3) {
      if (!formData.description.trim()) {
        setError('Please describe your funding request');
        return false;
      }
      if (!formData.useOfFunds.trim()) {
        setError('Please specify how you will use the funds');
        return false;
      }
      if (!formData.fundingTimeline) {
        setError('Please select a funding timeline');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate recipient
    if (!selectedUser) {
      setError('Please select a recipient investor');
      return;
    }
    
    if (selectedUser.role !== 'investor') {
      setError('You can only send fund requests to investors');
      return;
    }
    
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        fundingType: formData.fundingType,
        equityPercentage: formData.equityPercentage ? parseFloat(formData.equityPercentage) : null,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
        loanTenure: formData.loanTenure,
        description: formData.description.trim(),
        useOfFunds: formData.useOfFunds.trim(),
        companyName: formData.companyName.trim(),
        domain: formData.domain.trim(),
        yearOfEstablishment: parseInt(formData.yearOfEstablishment),
        teamSize: parseInt(formData.teamSize),
        previousFunding: parseFloat(formData.previousFunding) || 0,
        fundingTimeline: formData.fundingTimeline,
        milestone: formData.milestone.trim()
      });
      setStep(1);
    } catch (err) {
      setError(err.message || 'Failed to submit fund request');
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Fund Request</h2>
            <p className="text-blue-100 text-sm mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipient Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600">Requesting from:</p>
            <p className="font-semibold text-gray-900 text-lg">{selectedUser?.name || 'Unknown'}</p>
          </div>

          {/* Step 1: Company Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g., TechStartup Inc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain/Industry *
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    placeholder="e.g., FinTech, EdTech"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Established *
                  </label>
                  <select
                    name="yearOfEstablishment"
                    value={formData.yearOfEstablishment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size *
                  </label>
                  <input
                    type="number"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Funding (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    name="previousFunding"
                    value={formData.previousFunding}
                    onChange={handleChange}
                    placeholder="e.g., 500000"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Funding Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Funding Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="e.g., 500000"
                    min="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: ₹1,000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Type *
                  </label>
                  <select
                    name="fundingType"
                    value={formData.fundingType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    {fundingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equity Specific */}
              {formData.fundingType === 'equity' && (
                <div>
                  <label className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Equity Percentage Offered (%)</span>
                    <input
                      type="number"
                      name="equityPercentage"
                      value={formData.equityPercentage}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      min="0.1"
                      max="100"
                      step="0.1"
                      className="w-full mt-2 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </label>
                </div>
              )}

              {/* Debt Specific */}
              {formData.fundingType === 'debt' && (
                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate (% per annum) *
                    </label>
                    <input
                      type="number"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Tenure *
                    </label>
                    <input
                      type="text"
                      name="loanTenure"
                      value={formData.loanTenure}
                      onChange={handleChange}
                      placeholder="e.g., 24 months, 2 years"
                      className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Purpose & Timeline */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purpose & Timeline</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Funding Request *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Give a detailed overview of why you need this funding..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use of Funds (Breakdown) *
                </label>
                <textarea
                  name="useOfFunds"
                  value={formData.useOfFunds}
                  onChange={handleChange}
                  placeholder="How will you allocate the funds? (e.g., 40% R&D, 30% Marketing, 30% Operations)"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Timeline *
                </label>
                <select
                  name="fundingTimeline"
                  value={formData.fundingTimeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select timeline</option>
                  {timelineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Milestone (Optional)
                </label>
                <input
                  type="text"
                  name="milestone"
                  value={formData.milestone}
                  onChange={handleChange}
                  placeholder="e.g., Product Launch in 3 months, 1M users in 6 months"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Box */}
          {step === 3 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Once submitted, the investor will review your request and can approve, reject, or negotiate the terms.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 1 || submitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Previous
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundRequestForm;
