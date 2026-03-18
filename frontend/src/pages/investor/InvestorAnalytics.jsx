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
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

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
  Filler,
  RadialLinearScale
);

const InvestorAnalytics = () => {
  const { investor_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [startups, setStartups] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    if (investor_id) {
      fetchAllData();
    }
  }, [investor_id, timeframe]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [portfolioRes, startupsRes, metricsRes, trendsRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/investor-analytics/${investor_id}/portfolio`, { headers }),
        axios.get(`http://localhost:5001/api/investor-analytics/${investor_id}/startups`, { headers }),
        axios.get(`http://localhost:5001/api/investor-analytics/${investor_id}/metrics`, { headers }),
        axios.get(`http://localhost:5001/api/investor-analytics/${investor_id}/trends?timeframe=${timeframe}`, { headers })
      ]);

      setPortfolio(portfolioRes.data.portfolio);
      setAnalytics(portfolioRes.data.analytics);
      setStartups(startupsRes.data);
      setMetrics(metricsRes.data);
      setTrends(trendsRes.data.trends);
    } catch (err) {
      console.error('Error fetching investor analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
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

  if (!portfolio || portfolio.totalInvestments === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Investments Yet</h3>
        <p className="text-gray-600">Start investing in startups to see your analytics here.</p>
      </div>
    );
  }

  // Chart configurations
  const fundingTypeChartData = {
    labels: Object.keys(analytics?.fundingTypeBreakdown || {}),
    datasets: [{
      data: Object.values(analytics?.fundingTypeBreakdown || {}),
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderWidth: 1
    }]
  };

  const sectorChartData = {
    labels: Object.keys(analytics?.sectorBreakdown || {}),
    datasets: [{
      data: Object.values(analytics?.sectorBreakdown || {}),
      backgroundColor: [
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderWidth: 1
    }]
  };

  const timelineChartData = {
    labels: analytics?.investmentTimeline?.map(item => 
      new Date(item.date).toLocaleDateString()
    ) || [],
    datasets: [{
      label: 'Investment Amount',
      data: analytics?.investmentTimeline?.map(item => item.amount) || [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  const monthlyChartData = {
    labels: Object.keys(analytics?.monthlyInvestment || {}),
    datasets: [{
      label: 'Monthly Investment',
      data: Object.values(analytics?.monthlyInvestment || {}),
      backgroundColor: 'rgba(153, 102, 255, 0.8)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 1
    }]
  };

  const sizeDistributionData = {
    labels: Object.keys(analytics?.investmentSizeDistribution || {}),
    datasets: [{
      label: 'Number of Investments',
      data: Object.values(analytics?.investmentSizeDistribution || {}),
      backgroundColor: 'rgba(255, 159, 64, 0.8)',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 1
    }]
  };

  const diversificationData = {
    labels: ['Startups', 'Sectors', 'Funding Types'],
    datasets: [{
      label: 'Diversification',
      data: [
        portfolio?.totalStartups || 0,
        Object.keys(analytics?.sectorBreakdown || {}).length,
        Object.keys(analytics?.fundingTypeBreakdown || {}).length
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(54, 162, 235, 1)'
    }]
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600 mt-1">Track and analyze your investment journey</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="all">All Time</option>
          <option value="year">Last Year</option>
          <option value="quarter">Last Quarter</option>
          <option value="month">Last Month</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Invested"
          value={`₹${(portfolio?.totalInvested || 0).toLocaleString()}`}
          icon="💰"
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={trends?.totalGrowth}
        />
        <MetricCard
          title="Startups Funded"
          value={portfolio?.totalStartups || 0}
          icon="🏢"
          color="bg-gradient-to-r from-green-500 to-green-600"
          subtitle={`${portfolio?.totalInvestments || 0} total investments`}
        />
        <MetricCard
          title="Avg per Startup"
          value={`₹${(portfolio?.averagePerStartup || 0).toLocaleString()}`}
          icon="📊"
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <MetricCard
          title="Monthly Average"
          value={`₹${(trends?.monthlyAverage || 0).toLocaleString()}`}
          icon="📈"
          color="bg-gradient-to-r from-orange-500 to-orange-600"
        />
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Diversification Score</h3>
          <div className="flex items-center justify-between">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={metrics?.diversificationScore > 70 ? '#10b981' : metrics?.diversificationScore > 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45 * metrics?.diversificationScore / 100} ${2 * Math.PI * 45}`}
                  strokeDashoffset={2 * Math.PI * 45 * 0.25}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{metrics?.diversificationScore || 0}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-sm">Startups: {portfolio?.totalStartups}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm">Sectors: {Object.keys(analytics?.sectorBreakdown || {}).length}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                <span className="text-sm">Funding Types: {Object.keys(analytics?.fundingTypeBreakdown || {}).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Equity vs Debt</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Equity ({metrics?.equityVsDebt?.equityCount || 0})</span>
                <span className="font-medium">₹{(metrics?.equityVsDebt?.equity || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(metrics?.equityVsDebt?.equity / (metrics?.equityVsDebt?.equity + metrics?.equityVsDebt?.debt || 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Debt ({metrics?.equityVsDebt?.debtCount || 0})</span>
                <span className="font-medium">₹{(metrics?.equityVsDebt?.debt || 0).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(metrics?.equityVsDebt?.debt / (metrics?.equityVsDebt?.equity + metrics?.equityVsDebt?.debt || 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            {metrics?.avgEquityPercentage > 0 && (
              <p className="text-sm text-gray-600">
                Avg Equity: {metrics.avgEquityPercentage}%
              </p>
            )}
            {metrics?.avgInterestRate > 0 && (
              <p className="text-sm text-gray-600">
                Avg Interest: {metrics.avgInterestRate}%
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Sectors</h3>
          <div className="space-y-3">
            {metrics?.topSectors?.map((sector, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{sector.sector}</span>
                  <span className="font-medium">{sector.count} investments</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${(sector.count / portfolio.totalInvestments) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Investment Timeline</h3>
          <Line data={timelineChartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `₹${context.parsed.y.toLocaleString()}`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => '₹' + value.toLocaleString()
                }
              }
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sector Distribution</h3>
          <div className="h-64">
            <Pie data={sectorChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(2);
                      return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Investment</h3>
          <Bar data={monthlyChartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `₹${context.parsed.y.toLocaleString()}`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => '₹' + value.toLocaleString()
                }
              }
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Investment Size Distribution</h3>
          <Bar data={sizeDistributionData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.parsed.y} investments`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Funding Type Breakdown</h3>
          <div className="h-48">
            <Doughnut data={fundingTypeChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(2);
                      return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Startups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold">Portfolio Companies</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {startups.map((startupData, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {startupData.startup.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {startupData.startup.name}
                      </h4>
                      <p className="text-sm text-gray-500">{startupData.startup.domain}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Total Invested</p>
                      <p className="font-semibold text-lg">₹{startupData.totalInvested.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Investments</p>
                      <p className="font-semibold text-lg">{startupData.investmentCount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">First Investment</p>
                      <p className="text-sm font-medium">
                        {new Date(startupData.firstInvestment).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Last Investment</p>
                      <p className="text-sm font-medium">
                        {new Date(startupData.lastInvestment).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {startupData.fundingTypes.map((type, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStartup(selectedStartup === startupData ? null : startupData)}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    {selectedStartup === startupData ? (
                      <>▼ Hide Details</>
                    ) : (
                      <>▶ View Investment History</>
                    )}
                  </button>

                  {selectedStartup === startupData && (
                    <div className="mt-4 border-t pt-4">
                      <h5 className="font-medium mb-3 text-gray-700">Investment History</h5>
                      <div className="space-y-3">
                        {startupData.investments.map((investment, i) => (
                          <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  ₹{investment.amount.toLocaleString()} ({investment.currency})
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Type: <span className="font-medium capitalize">{investment.fundingType}</span>
                                  {investment.equityPercentage && (
                                    <span className="ml-2 text-indigo-600">| Equity: {investment.equityPercentage}%</span>
                                  )}
                                  {investment.interestRate && (
                                    <span className="ml-2 text-green-600">| Interest: {investment.interestRate}%</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(investment.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                Completed
                              </span>
                            </div>
                            {investment.description && (
                              <p className="text-sm text-gray-600 mt-3 bg-white p-2 rounded">
                                📝 {investment.description}
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
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {trends?.recentActivity?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {trends.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">💰</span>
                  </div>
                  <div>
                    <p className="font-medium">
                      Invested ₹{activity.amount.toLocaleString()} in {activity.startupName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()} • {activity.fundingType}
                    </p>
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

// Metric Card Component
const MetricCard = ({ title, value, icon, color, trend, subtitle }) => (
  <div className={`${color} rounded-lg shadow p-6 text-white`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white/80 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
    {trend && (
      <div className="mt-2 flex items-center">
        <span className={`text-sm ${trend > 0 ? 'text-green-300' : 'text-red-300'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
        <span className="text-white/60 text-xs ml-2">vs previous period</span>
      </div>
    )}
  </div>
);

export default InvestorAnalytics;