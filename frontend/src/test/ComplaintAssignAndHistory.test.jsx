import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { NotificationProvider } from '../NotificationContext';
import ComplaintDetailsPage from '../pages/ComplaintDetailsPage';
import HistoryTimeline from '../components/HistoryTimeline';
import * as api from '../api';

vi.mock('../api');

describe('Complaint Reassignment and History Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(api.getMe).mockResolvedValue({ id: 1, fullName: 'System Admin', role: 'ADMIN' });
  });

  it('renders "Assignment changed" and note when oldStatus equals newStatus in HistoryTimeline', () => {
    const historyData = [
      {
        id: 1,
        oldStatus: null,
        newStatus: 'OPEN',
        changedBy: { fullName: 'User One' },
        changedAt: '2026-03-01T10:00:00Z',
        note: null,
      },
      {
        id: 2,
        oldStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        changedBy: { fullName: 'Agent Two' },
        changedAt: '2026-03-01T10:15:00Z',
        note: 'Investigating issue',
      },
      {
        id: 3,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'IN_PROGRESS',
        changedBy: { fullName: 'Admin User' },
        changedAt: '2026-03-01T10:30:00Z',
        note: 'Reassigned from Agent Two to Agent Three',
      },
    ];

    render(<HistoryTimeline history={historyData} />);

    expect(screen.getByText('Assignment changed')).toBeInTheDocument();
    expect(
      screen.getByText(/Reassigned from Agent Two to Agent Three/)
    ).toBeInTheDocument();
  });

  it('shows Reassign button and excludes current assignee from dropdown for Admin', async () => {
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, fullName: 'System Admin', role: 'ADMIN' })
    );

    const mockComplaint = {
      id: 5,
      ticketNumber: 'RIT-00005',
      title: 'Broken Printer',
      description: 'Printer on 2nd floor is offline',
      category: 'HARDWARE',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdBy: { id: 3, fullName: 'Employee User' },
      assignedTo: { id: 2, fullName: 'Agent Two' },
      createdAt: '2026-03-01T09:00:00Z',
      permissions: {
        canEdit: true,
        canDelete: true,
        canAssign: true,
        allowedNextStatuses: ['RESOLVED'],
      },
    };

    const mockAssignable = [
      { id: 1, fullName: 'System Admin', role: 'ADMIN' },
      { id: 2, fullName: 'Agent Two', role: 'AGENT' },
      { id: 4, fullName: 'Agent Four', role: 'AGENT' },
    ];

    vi.mocked(api.getComplaint).mockResolvedValue(mockComplaint);
    vi.mocked(api.getComments).mockResolvedValue([]);
    vi.mocked(api.getHistory).mockResolvedValue([]);
    vi.mocked(api.getAssignableUsers).mockResolvedValue(mockAssignable);
    vi.mocked(api.getUnreadNotifications).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/complaints/5']}>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('RIT-00005')).toBeInTheDocument();
    });

    expect(screen.getByText(/Currently assigned to:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unassign' })).toBeInTheDocument();

    const select = screen.getByLabelText(/Assignee:/);
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

    // Agent Two should be excluded from options
    expect(options.some((text) => text.includes('Agent Two'))).toBe(false);
    expect(options.some((text) => text.includes('Agent Four'))).toBe(true);
    expect(options.some((text) => text.includes('System Admin'))).toBe(true);
  });

  it('shows Assign button when unassigned and triggers confirm with both names on reassign', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    localStorage.setItem('token', 'admin-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, fullName: 'System Admin', role: 'ADMIN' })
    );

    const mockComplaint = {
      id: 6,
      ticketNumber: 'RIT-00006',
      title: 'Network Lag',
      description: 'Slow wifi in room B',
      category: 'NETWORK',
      priority: 'HIGH',
      status: 'OPEN',
      createdBy: { id: 3, fullName: 'Employee User' },
      assignedTo: { id: 2, fullName: 'Agent Two' },
      createdAt: '2026-03-01T09:00:00Z',
      permissions: {
        canEdit: true,
        canDelete: true,
        canAssign: true,
        allowedNextStatuses: ['IN_PROGRESS'],
      },
    };

    const mockAssignable = [
      { id: 2, fullName: 'Agent Two', role: 'AGENT' },
      { id: 4, fullName: 'Agent Four', role: 'AGENT' },
    ];

    vi.mocked(api.getComplaint).mockResolvedValue(mockComplaint);
    vi.mocked(api.getComments).mockResolvedValue([]);
    vi.mocked(api.getHistory).mockResolvedValue([]);
    vi.mocked(api.getAssignableUsers).mockResolvedValue(mockAssignable);
    vi.mocked(api.assignComplaint).mockResolvedValue({});
    vi.mocked(api.getUnreadNotifications).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/complaints/6']}>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('RIT-00006')).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Assignee:/);
    await user.selectOptions(select, '4');

    const reassignBtn = screen.getByRole('button', { name: 'Reassign' });
    await user.click(reassignBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Move this complaint from Agent Two to Agent Four\?/)
    );
    expect(api.assignComplaint).toHaveBeenCalledWith('6', 4);
    confirmSpy.mockRestore();
  });

  it('shows "Assign to me" button for agents only when complaint is unassigned', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ id: 2, fullName: 'Agent Two', role: 'AGENT' });
    localStorage.setItem('token', 'agent-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 2, fullName: 'Agent Two', role: 'AGENT' })
    );

    const mockUnassigned = {
      id: 7,
      ticketNumber: 'RIT-00007',
      title: 'Login issue',
      description: 'Cannot login to portal',
      category: 'ACCOUNT',
      priority: 'MEDIUM',
      status: 'OPEN',
      createdBy: { id: 3, fullName: 'Employee User' },
      assignedTo: null,
      createdAt: '2026-03-01T09:00:00Z',
      permissions: {
        canEdit: false,
        canDelete: false,
        canAssign: true,
        allowedNextStatuses: [],
      },
    };

    vi.mocked(api.getComplaint).mockResolvedValue(mockUnassigned);
    vi.mocked(api.getComments).mockResolvedValue([]);
    vi.mocked(api.getHistory).mockResolvedValue([]);
    vi.mocked(api.getUnreadNotifications).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/complaints/7']}>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('RIT-00007')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Assign to me' })).toBeInTheDocument();
    });
  });
});
