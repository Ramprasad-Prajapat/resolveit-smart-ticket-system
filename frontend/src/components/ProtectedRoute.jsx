import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

/**
 * Route wrapper that redirects unauthenticated users to /login.
 * Optionally enforces specific user roles.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="state-box">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
