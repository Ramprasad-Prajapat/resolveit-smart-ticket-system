import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminUsersPage from '../pages/AdminUsersPage';
import { AuthProvider } from '../AuthContext';
import * as api from '../api';

vi.mock('../api');

describe('AdminUsersPage Component', () => {
  const currentAdmin = {
    id: 1,
    fullName: 'Admin User',
    email: 'admin@resolveit.com',
    role: 'ADMIN',
    active: true,
  };

  const mockUsers = [
    {
      id: 1,
      fullName: 'Admin User',
      email: 'admin@resolveit.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      fullName: 'Alice Agent',
      email: 'agent@resolveit.com',
      role: 'AGENT',
      active: true,
      createdAt: '2026-01-05T00:00:00Z',
    },
    {
      id: 3,
      fullName: 'Bob Citizen',
      email: 'citizen@resolveit.com',
      role: 'USER',
      active: false,
      createdAt: '2026-01-10T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'valid-admin-token');
    localStorage.setItem('user', JSON.stringify(currentAdmin));
    api.getMe.mockResolvedValue(currentAdmin);
    api.getAdminUsers.mockResolvedValue(mockUsers);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders users list and disables modification on own admin account', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <AdminUsersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('(You)')).toBeInTheDocument();
      expect(screen.getByText('Alice Agent')).toBeInTheDocument();
      expect(screen.getByText('Bob Citizen')).toBeInTheDocument();
    });

    // Check cells have data-label attributes
    const userCells = container.querySelectorAll('td[data-label="User"]');
    expect(userCells.length).toBe(3);

    // Self row should have disabled role dropdown and action button
    const selects = container.querySelectorAll('tbody select');
    expect(selects[0]).toBeDisabled(); // Admin User row

    const buttons = container.querySelectorAll('tbody button');
    expect(buttons[0]).toBeDisabled(); // Admin User row button
  });

  it('filters users by search text and role select', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <AdminUsersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Agent')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'citizen' } });

    expect(screen.getByText('Bob Citizen')).toBeInTheDocument();
    expect(screen.queryByText('Alice Agent')).toBeNull();

    // Reset search, test role filter
    fireEvent.change(searchInput, { target: { value: '' } });
    const roleFilter = container.querySelector('.filters-bar select');
    fireEvent.change(roleFilter, { target: { value: 'AGENT' } });

    expect(screen.getByText('Alice Agent')).toBeInTheDocument();
    expect(screen.queryByText('Bob Citizen')).toBeNull();
  });

  it('updates user role when selecting a new role', async () => {
    api.updateUserRole.mockResolvedValue({ id: 2, role: 'ADMIN' });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <AdminUsersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Agent')).toBeInTheDocument();
    });

    const selects = container.querySelectorAll('tbody select');
    const aliceSelect = selects[1]; // index 0 is Admin User, 1 is Alice

    fireEvent.change(aliceSelect, { target: { value: 'ADMIN' } });

    await waitFor(() => {
      expect(api.updateUserRole).toHaveBeenCalledWith(2, 'ADMIN');
      expect(screen.getByText('User role updated successfully')).toBeInTheDocument();
    });
  });

  it('toggles user active status when clicking button and confirms', async () => {
    api.updateUserActive.mockResolvedValue({ id: 2, active: false });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <AdminUsersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Agent')).toBeInTheDocument();
    });

    // Find enabled Deactivate button (for Alice)
    const buttons = container.querySelectorAll('tbody button');
    const aliceDeactivateBtn = buttons[1]; // Alice row button

    fireEvent.click(aliceDeactivateBtn);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to deactivate this user account?');
    await waitFor(() => {
      expect(api.updateUserActive).toHaveBeenCalledWith(2, false);
      expect(screen.getByText('User account deactivated successfully')).toBeInTheDocument();
    });
  });
});
