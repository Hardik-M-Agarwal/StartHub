// App.jsx
import React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ProtectedRoute from './components/ProtectedRoutes';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Public Pages
import LandingPage from './pages/LandingPage';
import ResourcesPage from './pages/ResourcesPage';
import GovernmentSchemes from './pages/GovernmentSchemes';
import IdeaFinder from './components/IdeaFinder';

// Admin Pages
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminEventDashboard from './pages/admin/AdminEventDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminStartupAnalytics from './pages/admin/AdminStartupAnalytics';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminCreateBlog from './pages/admin/AdminCreateBlog';

// Startup Pages  
import BrowseEvents from './pages/startup/BrowseEvents';
import MyEvents from './pages/startup/MyEvents';
import StartupAnalytics from './pages/startup/StartupAnalytics';
import StartupAddMetrics from './pages/startup/StartupAddMetrics';
import StartupBlogs from './pages/startup/StartupBlogs';
import StartupAnalysis from './pages/startup/StartupAnalysis';
import StartupAnalysisHistory from './pages/startup/StartupAnalysisHistory';
import BrowseInvestorsPage from './pages/startup/BrowseInvestors';
import StartupGovernance from './pages/startup/StartupGovernance'; // Import the new governance page

// Investor Pages
import InvestorAnalytics from './pages/investor/InvestorAnalytics';
import InvestorStartupAnalytics from './pages/investor/InvestorStartupAnalytics';
import InvestorBlogs from './pages/investor/InvestorBlogs';
import InvestorCreateBlog from './pages/investor/InvestorCreateBlog';
import BrowseStartupsPage from './pages/investor/BrowseStartups';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import StartupDashboard from './pages/startup/StartupDashboard';
import InvestorDashboard from './pages/investor/InvestorDashboard';

// Subscription Pages
import Pay from './components/Pay';
import SubscriptionPage from './pages/SubscriptionPage';

// Chat & Call Pages
import Chat from './pages/Chat';
import VideoCall from './pages/VideoCall';

gsap.registerPlugin(ScrollTrigger);

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Route wrapper to handle authentication for public routes
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    const dashboardPath = `/${user.role}/${user._id}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Routes - Redirect to dashboard if already logged in */}
              <Route path="/idea-finder" element={<IdeaFinder />} />
              <Route path="/" element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/govt_schemes" element={<GovernmentSchemes />} />

              {/* Subscription Routes */}
              <Route path="/investor/:investor_id/subscription" element={
                <ProtectedRoute requiredRole="investor">
                  <SubscriptionPage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/subscription" element={
                <ProtectedRoute requiredRole="startup">
                  <SubscriptionPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/subscription" element={
                <ProtectedRoute requiredRole="admin">
                  <SubscriptionPage />
                </ProtectedRoute>
              } />

              {/* Protected Admin Routes */}
              <Route path="/admin/:admin_id/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/events" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEventsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/events/:event_id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEventDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/startup/:startup_id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStartupAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/blogs" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBlogs />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/create-blog" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCreateBlog />
                </ProtectedRoute>
              } />
              <Route path="/admin/:admin_id/chats" element={
                <ProtectedRoute requiredRole="admin">
                  <Chat />
                </ProtectedRoute>
              } />

              {/* Protected Startup Routes */}
              <Route path="/startup/:startup_id/dashboard" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupDashboard />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/events" element={
                <ProtectedRoute requiredRole="startup">
                  <BrowseEvents />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/myevents" element={
                <ProtectedRoute requiredRole="startup">
                  <MyEvents />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/add-metrics" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupAddMetrics />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/analytics" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/blogs" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupBlogs />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/analysis" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupAnalysis />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/analysis-history" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupAnalysisHistory />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/chats" element={
                <ProtectedRoute requiredRole="startup">
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startup_id/browse-investors" element={
                <ProtectedRoute requiredRole="startup">
                  <BrowseInvestorsPage />
                </ProtectedRoute>
              } />
              {/* New Governance Route */}
              <Route path="/startup/:startup_id/governance" element={
                <ProtectedRoute requiredRole="startup">
                  <StartupGovernance />
                </ProtectedRoute>
              } />

              {/* Protected Investor Routes */}
              <Route path="/investor/:investor_id/dashboard" element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/analytics" element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/startup/:startup_id" element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorStartupAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/blogs" element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorBlogs />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/create-blog" element={
                <ProtectedRoute requiredRole="investor">
                  <InvestorCreateBlog />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/chats" element={
                <ProtectedRoute requiredRole="investor">
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/investor/:investor_id/browse-startups" element={
                <ProtectedRoute requiredRole="investor">
                  <BrowseStartupsPage />
                </ProtectedRoute>
              } />

              {/* Video Call - Public for now, can be protected if needed */}
              <Route path="/call/:roomId" element={<VideoCall />} />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default App;