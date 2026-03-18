import React, { useState } from 'react';
import { CheckCircle, XCircle, Copy, ChevronDown, TrendingUp, Users, Calendar, Target } from 'lucide-react';

const FundRequestMessage = ({ fundRequest, currentUser, onApprove, onReject, onPayment }) => {
  const [expanded, setExpanded] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Safely get IDs from fundRequest
  const investorId = fundRequest?.investorId?._id || fundRequest?.investorId;
  const startupId = fundRequest?.startupId?._id || fundRequest?.startupId;
  const currentUserId = currentUser?.id || currentUser?._id;

  const isInvestor = investorId && currentUserId && 
                     (investorId === currentUserId || investorId.toString() === currentUserId);
  const isStartup = startupId && currentUserId && 
                    (startupId === currentUserId || startupId.toString() === currentUserId);

  // Validate fund request has required data
  if (!fundRequest || !fundRequest._id) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Error: Invalid fund request data</p>
      </div>
    );
  }

  const statusConfig = {
    pending: { 
      color: 'yellow', 
      icon: '⏳',
      label: 'Pending Review',
      bgClass: 'bg-yellow-50 border-yellow-200',
      badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    },
    approved: { 
      color: 'green', 
      icon: '✅',
      label: 'Approved',
      bgClass: 'bg-green-50 border-green-200',
      badgeClass: 'bg-green-100 text-green-800 border border-green-300'
    },
    rejected: { 
      color: 'red', 
      icon: '❌',
      label: 'Rejected',
      bgClass: 'bg-red-50 border-red-200',
      badgeClass: 'bg-red-100 text-red-800 border border-red-300'
    },
    negotiating: { 
      color: 'blue', 
      icon: '💬',
      label: 'Under Negotiation',
      bgClass: 'bg-blue-50 border-blue-200',
      badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300'
    },
    completed: { 
      color: 'purple', 
      icon: '🎉',
      label: 'Completed',
      bgClass: 'bg-purple-50 border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300'
    }
  };

  const config = statusConfig[fundRequest.status];
  const fundingTypeLabel = fundRequest.fundingType.charAt(0).toUpperCase() + fundRequest.fundingType.slice(1).replace('_', ' ');

  const handleApprove = async () => {
    setActionInProgress(true);
    try {
      await onApprove(fundRequest._id);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() && fundRequest.status === 'pending') {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionInProgress(true);
    try {
      await onReject(fundRequest._id, rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePaymentClick = async () => {
    if (fundRequest.status === 'approved') {
      setShowPayment(true);
      await onPayment(fundRequest);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden shadow-lg w-full ${
      config.bgClass
    }`}>
      {/* Header */}
      <div 
        className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className="font-bold text-lg">Fund Request</h4>
            <p className="text-blue-100 text-sm">{fundRequest.companyName || 'Startup'} • {fundingTypeLabel}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Amount Highlight Bar */}
      <div className="px-4 py-3 bg-white bg-opacity-70 border-b-2 border-blue-200 flex items-baseline justify-between">
        <div>
          <p className="text-gray-600 text-sm">Requested Amount</p>
          <p className="text-3xl font-bold text-blue-600">₹{fundRequest.amount.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Status</p>
          <p className={`text-sm font-bold px-3 py-1 rounded-full ${config.badgeClass} inline-block`}>
            {config.label}
          </p>
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Company Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold uppercase">Company</p>
              <p className="text-gray-900 font-semibold mt-1">{fundRequest.companyName || 'N/A'}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold uppercase">Domain</p>
              <p className="text-gray-900 font-semibold mt-1">{fundRequest.domain || 'N/A'}</p>
            </div>

            {fundRequest.yearOfEstablishment && (
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold uppercase">Est.</p>
                <p className="text-gray-900 font-semibold mt-1">{fundRequest.yearOfEstablishment}</p>
              </div>
            )}

            {fundRequest.teamSize && (
              <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Team</p>
                  <p className="text-gray-900 font-semibold">{fundRequest.teamSize} members</p>
                </div>
              </div>
            )}
          </div>

          {/* Funding Type Details */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Funding Terms
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <p className="text-xs text-gray-600">Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize mt-1">
                  {fundRequest.fundingType.replace('_', ' ')}
                </p>
              </div>

              {fundRequest.equityPercentage !== null && fundRequest.equityPercentage !== undefined && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700 font-semibold">Equity Offered</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">{fundRequest.equityPercentage}%</p>
                </div>
              )}

              {fundRequest.interestRate && (
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-700 font-semibold">Interest Rate</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{fundRequest.interestRate}% p.a.</p>
                </div>
              )}

              {fundRequest.loanTenure && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs text-orange-700 font-semibold">Tenure</p>
                  <p className="text-sm font-bold text-orange-600 mt-1">{fundRequest.loanTenure}</p>
                </div>
              )}

              {fundRequest.previousFunding > 0 && (
                <div>
                  <p className="text-xs text-gray-600">Previous Funding</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">₹{fundRequest.previousFunding.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Request Details</p>
              <p className="text-sm text-gray-700 leading-relaxed">{fundRequest.description}</p>
            </div>

            {fundRequest.useOfFunds && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Use of Funds</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fundRequest.useOfFunds}</p>
              </div>
            )}
          </div>

          {/* Timeline & Milestone */}
          <div className="grid grid-cols-1 gap-3">
            {fundRequest.fundingTimeline && (
              <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold">Timeline</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{fundRequest.fundingTimeline}</p>
                </div>
              </div>
            )}

            {fundRequest.milestone && (
              <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-3">
                <Target className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold">Key Milestone</p>
                  <p className="text-sm text-gray-900 mt-0.5">{fundRequest.milestone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Reason Display */}
          {fundRequest.status === 'rejected' && fundRequest.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">Rejection Reason:</p>
              <p className="text-sm text-red-800">{fundRequest.rejectionReason}</p>
            </div>
          )}

          {/* Investor Notes */}
          {fundRequest.investorNotes && (
            <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">💬 Investor Notes:</p>
              <p className="text-sm text-blue-800">{fundRequest.investorNotes}</p>
            </div>
          )}

          {/* Action Buttons for Investor (when pending) */}
          {isInvestor && fundRequest.status === 'pending' && (
            <div className="pt-4 border-t-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionInProgress}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  disabled={actionInProgress}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>

              {/* Rejection Form */}
              {showRejectForm && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a constructive reason for rejection..."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={actionInProgress}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold transition-colors"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      disabled={actionInProgress}
                      className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Button for Investor (when approved) */}
          {isInvestor && fundRequest.status === 'approved' && (
            <div className="pt-4 border-t-2">
              <button
                onClick={handlePaymentClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg shadow-lg"
              >
                💳 Process Fund Transfer
              </button>
            </div>
          )}

          {/* Completed Status with Payment Info */}
          {fundRequest.status === 'completed' && (
            <div className="pt-4 border-t-2">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg text-center space-y-3">
                <p className="text-2xl">✅</p>
                <p className="font-bold text-green-900 text-lg">Payment Completed Successfully!</p>
                <p className="text-sm text-green-800">Your fund request has been processed.</p>
                {fundRequest.razorpayPaymentId && (
                  <div className="mt-3 p-2 bg-white rounded border border-green-300">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Payment ID</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                        {fundRequest.razorpayPaymentId}
                      </p>
                      <button
                        onClick={() => copyToClipboard(fundRequest.razorpayPaymentId)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy Payment ID"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-3 border-t border-gray-300 text-xs text-gray-600 text-center">
            Requested on {formatDate(fundRequest.createdAt)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundRequestMessage;
