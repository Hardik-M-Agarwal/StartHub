// pages/startup/StartupDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StartupAnalytics from './StartupAnalytics';
import StartupAnalysis from './StartupAnalysis';
import StartupBlogs from './StartupBlogs';
import BrowseEvents from './BrowseEvents';
import ProfileModal from '../../components/ProfileModal';
import Chat from '../Chat'
import BrowseInvestorsPage from './BrowseInvestors';
import ResourcesPage from '../ResourcesPage';
import GovermentSchemes from '../GovernmentSchemes';
import StartupAddMetrics from './StartupAddMetrics';
import StartupGovernance from './StartupGovernance';

const StartupDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get startup_id from URL params
  const { startup_id } = useParams();

  const sections = {
    analytics: {
      title: 'Startup Analytics',
      component: <StartupAnalytics />
    },
    governance: {
      title: 'Governance',
      component: <StartupGovernance />
    },
    addMetrics: {
      title: 'Add Metrics',
      component: <StartupAddMetrics />
    },
    analysis: {
      title: 'Startup Analysis',
      component: <StartupAnalysis />
    },
    blogs: {
      title: 'Startup Blogs',
      component: <StartupBlogs />
    },
    events: {
      title: 'Browse Events',
      component: <BrowseEvents />
    },
    chats: {
      title: 'Chats',
      component: <Chat />
    },
    investors: {
      title: 'Browse Investors',
      component: <BrowseInvestorsPage />
    },
    resources: {
      title: 'Resources',
      component: <ResourcesPage />
    },
    govt_schemes: {
      title: 'Government Schemes',
      component: <GovermentSchemes />
    }

  };

  // Fetch user data when component mounts
  useEffect(() => {
    if (startup_id) {
      fetchUserData();
    }
  }, [startup_id]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data for ID:', startup_id);

      // Try different backend URLs
      const backendURLs = [
        `http://localhost:5001/api/users/${startup_id}`,
        `http://localhost:3001/api/users/${startup_id}`,
        `http://localhost:8001/api/users/${startup_id}`,
        `/api/users/${startup_id}`  // Relative path (if using proxy)
      ];

      let response;
      for (const url of backendURLs) {
        try {
          console.log('Trying URL:', url);
          response = await axios.get(url);
          console.log('✅ Success with URL:', url);
          break;
        } catch (err) {
          console.log('❌ Failed with URL:', url);
          continue;
        }
      }

      if (response) {
        setUserData(response.data);
      } else {
        throw new Error('All backend URLs failed');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use mock data as fallback
      setUserData({
        _id: startup_id,
        name: 'Demo Startup',
        email: 'startup@example.com',
        role: 'startup',
        isSubscribed: true,
        createdAt: new Date().toISOString(),
        domain: 'Technology'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white">
        <div className="p-4 border-b border-indigo-600">
          <h2 className="text-xl font-semibold">Startup Portal</h2>
        </div>
        <nav className="p-4">
          {Object.keys(sections).map((section) => (
            <button
              key={section}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition duration-200 ${activeSection === section
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              onClick={() => setActiveSection(section)}
            >
              {sections[section].title}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">{sections[activeSection].title}</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <span className="text-xl">🔔</span>
              </button>

              {/* Profile Trigger */}
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {userData?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium block">
                    {loading ? 'Loading...' : userData?.name || 'Startup'}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {userData?.role || 'startup'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {sections[activeSection].component}
        </main>
      </div>

      {/* Profile Modal - This is rendered inside the dashboard */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={startup_id}
      />
    </div>
  );
};

export default StartupDashboard;