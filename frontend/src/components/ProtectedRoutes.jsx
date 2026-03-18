import { useAuth } from '../context/AuthContext';
import { Navigate, useParams } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const params = useParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is accessing their own routes
  const userIdFromRoute = params.admin_id || params.startup_id || params.investor_id;
  if (userIdFromRoute && userIdFromRoute !== user._id) {
    return <Navigate to={`/${user.role}/${user._id}/dashboard`} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}/${user._id}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;