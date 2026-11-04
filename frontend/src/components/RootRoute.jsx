import { useAuth } from '../AuthContext';
import DashboardPage from '../pages/DashboardPage';
import HomePage from '../pages/HomePage';

/**
 * Route switcher for the root path "/".
 * Shows DashboardPage if user is logged in, or HomePage if visitor is logged out.
 */
export default function RootRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="state-box">Loading session...</div>;
  }

  return isAuthenticated ? <DashboardPage /> : <HomePage />;
}
