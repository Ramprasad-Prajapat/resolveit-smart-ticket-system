import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import RootRoute from '../components/RootRoute';

// Mock api calls used by AuthProvider and DashboardPage
vi.mock('../api', () => ({
  getMe: vi.fn().mockResolvedValue({
    id: 1,
    fullName: 'Active User',
    email: 'user@example.com',
    role: 'USER',
  }),
  getComplaints: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  }),
  getComplaintSummary: vi.fn().mockResolvedValue({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    assignedToMe: 0,
    unassigned: 0,
  }),
}));

describe('RootRoute Component', () => {
  it('renders HomePage when user is logged out', () => {
    localStorage.clear();

    render(
      <BrowserRouter>
        <AuthProvider>
          <RootRoute />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Raise, track and resolve complaints in one place/i
    );
  });

  it('renders DashboardPage when user is logged in', async () => {
    localStorage.setItem('token', 'mock-valid-jwt');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, fullName: 'Active User', email: 'user@example.com', role: 'USER' })
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <RootRoute />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(await screen.findByText(/Complaint Dashboard/i)).toBeInTheDocument();
  });
});
