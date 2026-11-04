import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { NotificationProvider, useNotification } from '../NotificationContext';
import NotificationToasts from '../components/NotificationToasts';
import * as api from '../api';

vi.mock('../api');

function TestComponent() {
  const { showToast } = useNotification();
  return (
    <div>
      <NotificationToasts />
      <button
        onClick={() =>
          showToast({
            type: 'INFO',
            title: 'Local Alert',
            message: 'This is a test notification',
            ticketNumber: 'RIT-00099',
            complaintId: 99,
          })
        }
      >
        Trigger Local Toast
      </button>
    </div>
  );
}

describe('NotificationToasts and NotificationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    vi.mocked(api.getMe).mockResolvedValue({ id: 10, fullName: 'Agent Smith', role: 'AGENT' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll when logged out', async () => {
    vi.mocked(api.getUnreadNotifications).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(api.getUnreadNotifications).not.toHaveBeenCalled();
  });

  it('polls on login and displays unread alerts with ticket number and message', async () => {
    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    vi.mocked(api.getUnreadNotifications).mockResolvedValueOnce([
      {
        id: 101,
        type: 'ASSIGNED_TO_YOU',
        title: 'New complaint assigned to you',
        message: 'Ticket RIT-00042 (priority High, status Open) was assigned to you.',
        ticketNumber: 'RIT-00042',
        complaintId: 42,
        createdAt: '2026-03-01T12:00:00Z',
      },
    ]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.getUnreadNotifications).toHaveBeenCalled();
      expect(screen.getByText('RIT-00042')).toBeInTheDocument();
      expect(screen.getByText('New complaint assigned to you')).toBeInTheDocument();
      expect(
        screen.getByText('Ticket RIT-00042 (priority High, status Open) was assigned to you.')
      ).toBeInTheDocument();
    });
  });

  it('clicking OK dismisses the alert and calls markNotificationRead', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    vi.mocked(api.getUnreadNotifications).mockResolvedValueOnce([
      {
        id: 102,
        type: 'REASSIGNED_FROM_YOU',
        title: 'Complaint reassigned',
        message: 'Ticket RIT-00043 was moved from you to Jane.',
        ticketNumber: 'RIT-00043',
        complaintId: 43,
        createdAt: '2026-03-01T12:00:00Z',
      },
    ]);
    vi.mocked(api.markNotificationRead).mockResolvedValue({});

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('RIT-00043')).toBeInTheDocument();
    });

    const okBtn = screen.getByRole('button', { name: 'OK' });
    await user.click(okBtn);

    await waitFor(() => {
      expect(api.markNotificationRead).toHaveBeenCalledWith(102);
      expect(screen.queryByText('RIT-00043')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses alert after ALERT_SECONDS and calls markNotificationRead', async () => {
    vi.useFakeTimers();

    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    vi.mocked(api.getUnreadNotifications).mockResolvedValue([
      {
        id: 103,
        type: 'UNASSIGNED_FROM_YOU',
        title: 'Complaint unassigned',
        message: 'Ticket RIT-00044 was unassigned from you.',
        ticketNumber: 'RIT-00044',
        complaintId: 44,
        createdAt: '2026-03-01T12:00:00Z',
      },
    ]);
    vi.mocked(api.markNotificationRead).mockResolvedValue({});

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial render and flush pending promises
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('RIT-00044')).toBeInTheDocument();

    // Fast-forward 30 seconds
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(api.markNotificationRead).toHaveBeenCalledWith(103);
    expect(screen.queryByText('RIT-00044')).not.toBeInTheDocument();
  });

  it('does not display the same notification id twice', async () => {
    vi.useFakeTimers();

    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    const alertItem = {
      id: 104,
      type: 'ASSIGNED_TO_YOU',
      title: 'Assigned to you',
      message: 'Ticket RIT-00045 was assigned to you.',
      ticketNumber: 'RIT-00045',
      complaintId: 45,
      createdAt: '2026-03-01T12:00:00Z',
    };

    vi.mocked(api.getUnreadNotifications).mockResolvedValue([alertItem]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText('RIT-00045').length).toBe(1);

    // Second poll returns same unread item
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(screen.getAllByText('RIT-00045').length).toBe(1);
  });

  it('pauses polling when document is hidden', async () => {
    vi.useFakeTimers();

    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    vi.mocked(api.getUnreadNotifications).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    const callCount = api.getUnreadNotifications.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(1);

    // Simulate tab hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    // Still same call count because tab was hidden
    expect(api.getUnreadNotifications).toHaveBeenCalledTimes(callCount);
  });

  it('ignores failing poll silently without crash', async () => {
    vi.useFakeTimers();

    localStorage.setItem('token', 'token-123');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 10, fullName: 'Agent Smith', role: 'AGENT' })
    );

    vi.mocked(api.getUnreadNotifications).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('showToast triggers local toast and auto-closes after timeout', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <AuthProvider>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const btn = screen.getByText('Trigger Local Toast');
    await act(async () => {
      btn.click();
    });

    expect(screen.getByText('Local Alert')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    expect(screen.getByText('RIT-00099')).toBeInTheDocument();

    // Fast-forward auto-dismiss
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.queryByText('Local Alert')).not.toBeInTheDocument();
    expect(api.markNotificationRead).not.toHaveBeenCalled();
  });
});
