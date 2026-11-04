import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import RegisterPage from '../pages/RegisterPage';
import * as api from '../api';

vi.mock('../api');

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates password rule checklist as user types', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const pwdInput = screen.getByLabelText(/^password$/i);

    // Initially all invalid
    expect(screen.getByText(/8 to 64 characters/i)).toBeInTheDocument();

    await user.type(pwdInput, 'Abcdefgh1');

    const checklistItems = screen.getAllByRole('listitem');
    expect(checklistItems[0]).toHaveClass('valid');
    expect(checklistItems[1]).toHaveClass('valid');
    expect(checklistItems[2]).toHaveClass('valid');
  });

  it('blocks registration when passwords do not match', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/full name/i), 'Alice Bob');
    await user.type(screen.getByLabelText(/email address/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password999');

    const submitBtn = screen.getByRole('button', { name: /register/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('calls register API successfully on valid inputs', async () => {
    const user = userEvent.setup();
    vi.mocked(api.register).mockResolvedValueOnce({
      token: 'fake-jwt-token',
      user: { id: 1, fullName: 'Alice Bob', email: 'alice@test.com', role: 'USER' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/full name/i), 'Alice Bob');
    await user.type(screen.getByLabelText(/email address/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitBtn = screen.getByRole('button', { name: /register/i });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith('Alice Bob', 'alice@test.com', 'Password123');
    });
  });
});
