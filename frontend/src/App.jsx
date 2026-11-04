import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import NotificationToasts from './components/NotificationToasts';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RootRoute from './components/RootRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintFormPage from './pages/ComplaintFormPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Root Application component setting up global providers, navbar, and route tree.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <NotificationProvider>
            <Navbar />
            <NotificationToasts />
            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Root Route: Dashboard for logged in, Home for visitors */}
                <Route path="/" element={<RootRoute />} />
                <Route
                  path="/complaints/new"
                  element={
                    <ProtectedRoute>
                      <ComplaintFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints/:id"
                  element={
                    <ProtectedRoute>
                      <ComplaintDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints/:id/edit"
                  element={
                    <ProtectedRoute>
                      <ComplaintFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Only Route */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </NotificationProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
