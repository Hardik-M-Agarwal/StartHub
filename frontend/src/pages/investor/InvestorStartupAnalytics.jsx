import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, Filler } from 'chart.js';
import { TrendingUp, DollarSign, Users, Eye, Activity, BarChart2, PieChart as PieChartIcon, Calendar, Award, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend);

const InvestorStartupAnalytics = () => {
  const { startup_id } = useParams();
  const [allMetrics, setAllMetrics] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  useEffect(() => {
    async function fetchMetrics() {
      const res = await api.get(`/analytics/startup/${startup_id}/metrics`);
      
      // Sort metrics chronologically by period
      const sortedMetrics = res.data.sort((a, b) => {
        const [aMonth, aYear] = a.period.split(' ');
        const [bMonth, bYear] = b.period.split(' ');
        const aDate = new Date(`${aMonth} 1, ${aYear}`);
        const bDate = new Date(`${bMonth} 1, ${bYear}`);
        return aDate - bDate;
      });
      
      setAllMetrics(sortedMetrics);
      setMetrics(sortedMetrics);
      
      // Extract unique periods for filter
      const periods = [...new Set(sortedMetrics.map(m => m.period))];
      setAvailablePeriods(periods);
    }
    fetchMetrics();
  }, [startup_id]);

  // Apply period filter
  useEffect(() => {
    if (selectedPeriod === 'all') {
      setMetrics(allMetrics);
    } else {
      setMetrics(allMetrics.filter(m => m.period === selectedPeriod));
    }
  }, [selectedPeriod, allMetrics]);

  // Calculate key metrics
  const latestMetric = metrics[metrics.length - 1] || {};
  const previousMetric = metrics[metrics.length - 2] || {};
  const firstMetric = metrics[0] || {};
  
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const revenueChange = calculateChange(latestMetric.revenue, previousMetric.revenue);
  const profitChange = calculateChange(latestMetric.profit, previousMetric.profit);
  const usersChange = calculateChange(latestMetric.totalUsers, previousMetric.totalUsers);

  const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalProfit = metrics.reduce((sum, m) => sum + (m.profit || 0), 0);
  const avgRevenue = metrics.length > 0 ? (totalRevenue / metrics.length) : 0;
  const profitMargin = latestMetric.revenue ? ((latestMetric.profit / latestMetric.revenue) * 100).toFixed(1) : 0;
  const userGrowthRate = metrics.length > 1 ? 
    (((latestMetric.totalUsers - metrics[0].totalUsers) / metrics[0].totalUsers) * 100).toFixed(1) : 0;

  // Main trend chart with gradients
  const trendChartData = {
    labels: metrics.map(m => m.period),
    datasets: [
      {
        label: 'Revenue',
        data: metrics.map(m => m.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Profit',
        data: metrics.map(m => m.profit),
        borderColor: '#10b981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const userGrowthData = {
    labels: metrics.map(m => m.period),
    datasets: [
      {
        label: 'Total Users',
        data: metrics.map(m => m.totalUsers),
        borderColor: '#f59e0b',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
    ],
  };

  // Monthly comparison bar chart
  const monthlyComparisonData = {
    labels: metrics.slice(-8).map(m => m.period),
    datasets: [
      {
        label: 'Revenue',
        data: metrics.slice(-8).map(m => m.revenue),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
          return gradient;
        },
        borderRadius: 8,
        borderWidth: 0,
      },
      {
        label: 'Profit',
        data: metrics.slice(-8).map(m => m.profit),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.6)');
          return gradient;
        },
        borderRadius: 8,
        borderWidth: 0,
      },
    ],
  };

  // Performance distribution
  const revenueDistributionData = {
    labels: metrics.slice(-6).map(m => m.period),
    datasets: [{
      data: metrics.slice(-6).map(m => m.revenue),
      backgroundColor: [
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#10b981',
        '#06b6d4',
      ],
      borderWidth: 0,
      hoverOffset: 15,
    }],
  };

  // Performance radar chart
  const performanceRadarData = {
    labels: ['Revenue Growth', 'Profit Margin', 'User Growth', 'Consistency', 'ROI'],
    datasets: [{
      label: 'Performance Metrics',
      data: [
        Math.min(Math.abs(parseFloat(revenueChange)), 100),
        Math.min(parseFloat(profitMargin), 100),
        Math.min(Math.abs(parseFloat(userGrowthRate)), 100),
        85,
        totalRevenue > 0 ? Math.min(((totalProfit / totalRevenue) * 100), 100) : 0
      ],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366f1',
      borderWidth: 3,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#6366f1',
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 13, weight: '600' },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += '$' + context.parsed.y.toLocaleString();
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
        },
        border: { display: false },
      },
    },
  };

  // Separate options for user growth chart (no $ signs)
  const userChartOptions = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      tooltip: {
        ...lineChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toLocaleString();
            return label;
          }
        }
      },
    },
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        ticks: {
          ...lineChartOptions.scales.y.ticks,
          callback: function(value) {
            return value.toLocaleString();
          }
        },
      },
    },
  };

  const barChartOptions = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      legend: {
        ...lineChartOptions.plugins.legend,
        labels: {
          ...lineChartOptions.plugins.legend.labels,
          generateLabels: function(chart) {
            const data = chart.data;
            return data.datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: typeof dataset.backgroundColor === 'function' 
                ? dataset.backgroundColor({ chart, datasetIndex: i }) 
                : dataset.backgroundColor,
              hidden: !chart.isDatasetVisible(i),
              lineCap: 'round',
              lineDash: [],
              lineDashOffset: 0,
              lineJoin: 'round',
              lineWidth: 3,
              strokeStyle: dataset.borderColor,
              pointStyle: 'rect',
              datasetIndex: i
            }));
          }
        }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: { 
          padding: 15, 
          font: { size: 12, weight: '600' },
          color: '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 16,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
          }
        }
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#9ca3af',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        pointLabels: {
          color: '#374151',
          font: { size: 12, weight: '600' },
        },
        angleLines: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const InvestorStatCard = ({ icon: Icon, title, value, change, gradient, subtitle }) => (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className="absolute inset-0 bg-blue opacity-10 rounded-full"></div>
      </div>
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-blue bg-opacity-20 backdrop-blur-sm">
            <Icon className="w-7 h-7 text-white" />
          </div>
          {change !== undefined && (
            <div className="flex items-center bg-blue bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              {parseFloat(change) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-white mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-white mr-1" />
              )}
              <span className="text-sm font-bold text-white">
                {parseFloat(change) >= 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <h3 className="text-white text-opacity-90 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</h3>
        <p className="text-3xl font-bold text-white mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value || '—'}
        </p>
        {subtitle && <p className="text-sm text-white text-opacity-75">{subtitle}</p>}
      </div>
    </div>
  );

  const InsightCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl mr-4 shadow-lg">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">Investor Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive startup performance metrics and growth insights</p>
              </div>
            </div>
            
            {/* Period Filter */}
            <div className="flex items-center bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-200">
              <Calendar className="w-5 h-5 text-gray-500 mr-3" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Periods</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Investor Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InvestorStatCard
            icon={DollarSign}
            title="Current Revenue"
            value={`$${(latestMetric.revenue || 0).toLocaleString()}`}
            change={revenueChange}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            subtitle="Latest period performance"
          />
          <InvestorStatCard
            icon={Activity}
            title="Current Profit"
            value={`$${(latestMetric.profit || 0).toLocaleString()}`}
            change={profitChange}
            gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            subtitle={`${profitMargin}% profit margin`}
          />
          <InvestorStatCard
            icon={Users}
            title="Total Users"
            value={latestMetric.totalUsers}
            change={usersChange}
            gradient="bg-gradient-to-br from-orange-500 to-amber-600"
            subtitle={`${userGrowthRate}% total growth`}
          />
        </div>

        {/* Investment Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InsightCard
            icon={Activity}
            title="Avg Revenue"
            value={`$${avgRevenue.toFixed(0).toLocaleString()}`}
            color="bg-indigo-500"
          />
          <InsightCard
            icon={Target}
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            color="bg-purple-500"
          />
          <InsightCard
            icon={Zap}
            title="Total Profit"
            value={`$${totalProfit.toLocaleString()}`}
            color="bg-emerald-500"
          />
          <InsightCard
            icon={Calendar}
            title="Data Points"
            value={metrics.length}
            color="bg-cyan-500"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue & Profit Trends */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Revenue & Profit Trends</h2>
                  <p className="text-xs text-gray-500">Financial performance over time</p>
                </div>
              </div>
            </div>
            <div className="h-80">
              <Line data={trendChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Performance Radar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance Score</h3>
                <p className="text-xs text-gray-500">Multi-dimensional analysis</p>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center">
              <div className="w-full h-full">
                <Radar data={performanceRadarData} options={radarOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Comparison */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg mr-3">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue vs Profit Comparison</h3>
                <p className="text-xs text-gray-500">Last 8 periods comparison</p>
              </div>
            </div>
            <div className="h-80">
              <Bar data={monthlyComparisonData} options={barChartOptions} />
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg mr-3">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Mix</h3>
                <p className="text-xs text-gray-500">Recent distribution</p>
              </div>
            </div>
            <div className="h-80">
              <Doughnut data={revenueDistributionData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* User Growth & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg mr-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Growth Trajectory</h3>
                <p className="text-xs text-gray-500">Cumulative user acquisition</p>
              </div>
            </div>
            <div className="h-80">
              <Line data={userGrowthData} options={userChartOptions} />
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-bold">Peak Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-xs text-black text-opacity-75 mb-1 uppercase tracking-wide">Best Revenue</p>
                <p className="text-2xl text-black font-bold">
                  {metrics.length > 0 
                    ? `$${Math.max(...metrics.map(m => m.revenue || 0)).toLocaleString()}`
                    : '$0'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-xs text-black text-opacity-75 mb-1 uppercase tracking-wide">Best Profit</p>
                <p className="text-2xl text-black font-bold">
                  {metrics.length > 0 
                    ? `$${Math.max(...metrics.map(m => m.profit || 0)).toLocaleString()}`
                    : '$0'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-xs text-black text-opacity-75 mb-1 uppercase tracking-wide">Peak Users</p>
                <p className="text-2xl text-black font-bold">
                  {metrics.length > 0 
                    ? Math.max(...metrics.map(m => m.totalUsers || 0)).toLocaleString()
                    : '0'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-xs text-black text-opacity-75 mb-1 uppercase tracking-wide">ROI Indicator</p>
                <p className="text-2xl text-black font-bold">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorStartupAnalytics;