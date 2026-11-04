import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import LoginPage from '../pages/LoginPage';
import * as api from '../api';

vi.mock('../api');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('contains no demo credentials or passwords in rendered DOM', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/Demo@1234/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin@resolveit.com/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quick Demo/i)).not.toBeInTheDocument();
  });

  it('displays 401 invalid credentials message', async () => {
    const user = userEvent.setup();
    const error401 = new Error('Invalid email or password');
    error401.status = 401;
    vi.mocked(api.login).mockRejectedValueOnce(error401);

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('displays 403 account deactivated message', async () => {
    const user = userEvent.setup();
    const error403 = new Error('Your account is deactivated');
    error403.status = 403;
    vi.mocked(api.login).mockRejectedValueOnce(error403);

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), 'deact@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Pass12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Your account is deactivated')).toBeInTheDocument();
    });
  });

  it('displays 429 too many attempts message', async () => {
    const user = userEvent.setup();
    const error429 = new Error('Too many failed login attempts. Try again in 15 minute(s).');
    error429.status = 429;
    vi.mocked(api.login).mockRejectedValueOnce(error429);

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), 'locked@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Pass12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Too many failed login attempts/i)).toBeInTheDocument();
    });
  });
});
