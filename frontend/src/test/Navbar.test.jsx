import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../AuthContext';

describe('Navbar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when user is not authenticated', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders brand and navigation links for authenticated regular user', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      fullName: 'John Citizen',
      email: 'citizen@example.com',
      role: 'USER'
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('ResolveIT')).toBeInTheDocument();
    expect(screen.getByText('Complaints')).toBeInTheDocument();
    expect(screen.getByText('New Complaint')).toBeInTheDocument();
    expect(screen.queryByText('Users')).toBeNull();
    expect(screen.getByText('John Citizen')).toBeInTheDocument();
  });

  it('renders Users link when logged in as ADMIN', () => {
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem('user', JSON.stringify({
      id: 99,
      fullName: 'System Admin',
      email: 'admin@resolveit.com',
      role: 'ADMIN'
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('toggles mobile menu with click and keyboard (Enter, Space, Escape)', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      fullName: 'John Citizen',
      email: 'citizen@example.com',
      role: 'USER'
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Click to close
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Enter key to open
    fireEvent.keyDown(toggleBtn, { key: 'Enter' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Escape key on window to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Space key to open
    fireEvent.keyDown(toggleBtn, { key: ' ' });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Link click to close
    const complaintsLink = screen.getByText('Complaints');
    fireEvent.click(complaintsLink);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles logout button click', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      fullName: 'John Citizen',
      email: 'citizen@example.com',
      role: 'USER'
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
