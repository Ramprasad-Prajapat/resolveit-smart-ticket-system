import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import ProfilePage from '../pages/ProfilePage';
import * as api from '../api';

vi.mock('../api');

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        role: 'USER',
        createdAt: '2026-01-15T10:00:00',
      })
    );
  });

  it('renders user details and profile forms', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  it('validates password requirements before submit', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /change password/i });
    expect(submitBtn).toBeDisabled();

    await user.type(screen.getByLabelText(/current password/i), 'OldPassword1');
    await user.type(screen.getByLabelText(/^new password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');

    expect(submitBtn).toBeDisabled();
  });

  it('calls changePassword on valid matching input', async () => {
    const user = userEvent.setup();
    vi.mocked(api.changePassword).mockResolvedValueOnce({ message: 'Password changed successfully' });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/current password/i), 'OldPassword1');
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword123');

    const submitBtn = screen.getByRole('button', { name: /change password/i });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith('OldPassword1', 'NewPassword123');
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
    });
  });
});
