import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    localStorage.clear();

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, fullName: 'Test User', email: 'test@example.com', role: 'USER' })
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
  });

  it('redirects when user lacks required role', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, fullName: 'Test User', email: 'test@example.com', role: 'USER' })
    );

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>Home Page Mock</div>} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div>Admin Users Secret</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin Users Secret')).not.toBeInTheDocument();
  });
});
