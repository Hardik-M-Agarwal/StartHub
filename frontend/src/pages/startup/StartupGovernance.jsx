import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const StartupGovernance = () => {
  const { startup_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [governanceData, setGovernanceData] = useState({
    investors: [],
    statistics: {}
  });
  const [concentrationData, setConcentrationData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    if (startup_id) {
      fetchGovernanceData();
      fetchConcentrationData();
      fetchTimeline();
    }
  }, [startup_id, timeframe]);

 const fetchGovernanceData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token'); // Get token from localStorage
    
    const response = await axios.get(
      `http://localhost:5001/api/governance/startup/${startup_id}/investors`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    setGovernanceData(response.data);
  } catch (err) {
    console.error('Error fetching governance data:', err);
    if (err.response?.status === 401) {
      setError('Please login to view governance data');
    } else if (err.response?.status === 403) {
      setError('You are not authorized to view this data');
    } else {
      setError('Failed to load governance data');
    }
  } finally {
    setLoading(false);
  }
};

const fetchConcentrationData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5001/api/governance/startup/${startup_id}/concentration`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    setConcentrationData(response.data);
  } catch (err) {
    console.error('Error fetching concentration data:', err);
  }
};

const fetchTimeline = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5001/api/governance/startup/${startup_id}/timeline`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    setTimeline(response.data);
  } catch (err) {
    console.error('Error fetching timeline:', err);
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const { statistics = {} } = governanceData;

  // Chart configurations
  const fundingTypeChartData = {
    labels: Object.keys(statistics.fundingTypeBreakdown || {}),
    datasets: [
      {
        label: 'Amount by Funding Type',
        data: Object.values(statistics.fundingTypeBreakdown || {}),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const timelineChartData = {
    labels: (statistics.investmentTimeline || []).map(item => 
      new Date(item.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Investment Amount',
        data: (statistics.investmentTimeline || []).map(item => item.amount),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const monthlyChartData = {
    labels: Object.keys(statistics.monthlyInvestment || {}),
    datasets: [
      {
        label: 'Monthly Investment',
        data: Object.values(statistics.monthlyInvestment || {}),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Startup Governance</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Time</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Investment"
          value={`₹${(statistics.totalInvestment || 0).toLocaleString()}`}
          icon="💰"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Investors"
          value={statistics.totalInvestors || 0}
          icon="👥"
          color="bg-green-500"
        />
        <StatCard
          title="Average Investment"
          value={`₹${(statistics.averageInvestment || 0).toLocaleString()}`}
          icon="📊"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Transactions"
          value={statistics.totalTransactions || 0}
          icon="📝"
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Investment Timeline</h3>
          <Line data={timelineChartData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₹' + value.toLocaleString();
                  }
                }
              }
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Funding Type Breakdown</h3>
          <div className="h-64">
            <Pie data={fundingTypeChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.label || '';
                      let value = context.raw || 0;
                      let total = context.dataset.data.reduce((a, b) => a + b, 0);
                      let percentage = ((value / total) * 100).toFixed(2);
                      return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Investment Trend</h3>
          <Bar data={monthlyChartData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₹' + value.toLocaleString();
                  }
                }
              }
            }
          }} />
        </div>

        {concentrationData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Investor Concentration</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">HHI Index:</span>
                <span className="font-semibold">{concentrationData.hhi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Concentration Level:</span>
                <span className={`font-semibold ${
                  concentrationData.concentrationLevel === 'Low' ? 'text-green-600' :
                  concentrationData.concentrationLevel === 'Moderate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {concentrationData.concentrationLevel}
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Top Investors</h4>
                {concentrationData.concentration.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span>Investor {index + 1}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Investors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Investors Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {governanceData.investors && governanceData.investors.length > 0 ? (
            governanceData.investors.map((investorData, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {investorData.investor.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {investorData.investor.name}
                        </h4>
                        <p className="text-sm text-gray-500">{investorData.investor.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Invested</p>
                        <p className="font-semibold">₹{investorData.totalInvested.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Investments</p>
                        <p className="font-semibold">{investorData.investmentCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">First Investment</p>
                        <p className="text-sm">
                          {new Date(investorData.firstInvestment).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Investment</p>
                        <p className="text-sm">
                          {new Date(investorData.lastInvestment).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Funding Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {investorData.fundingTypes.map((type, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedInvestor(
                        selectedInvestor === investorData ? null : investorData
                      )}
                      className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {selectedInvestor === investorData ? 'Hide Details' : 'View Details'}
                    </button>

                    {selectedInvestor === investorData && (
                      <div className="mt-4 border-t pt-4">
                        <h5 className="font-medium mb-3">Investment History</h5>
                        <div className="space-y-3">
                          {investorData.investments.map((investment, i) => (
                            <div key={i} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    ₹{investment.amount.toLocaleString()} ({investment.currency})
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Type: {investment.fundingType}
                                    {investment.equityPercentage && ` | Equity: ${investment.equityPercentage}%`}
                                    {investment.interestRate && ` | Interest: ${investment.interestRate}%`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(investment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  investment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  investment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {investment.status}
                                </span>
                              </div>
                              {investment.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {investment.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No investors found for this startup
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Funding Timeline</h3>
          <div className="relative">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start mb-4">
                <div className="w-24 flex-shrink-0">
                  <p className="text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-lg ${
                    item.status === 'approved' ? 'bg-green-50 border border-green-200' :
                    item.status === 'completed' ? 'bg-blue-50 border border-blue-200' :
                    item.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-medium">
                        ₹{item.amount.toLocaleString()} ({item.currency})
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.fundingType} • {item.investorId?.name}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default StartupGovernance;