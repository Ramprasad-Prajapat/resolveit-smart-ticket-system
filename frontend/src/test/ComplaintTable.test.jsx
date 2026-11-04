import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComplaintTable from '../components/ComplaintTable';

describe('ComplaintTable Component', () => {
  it('renders empty state message when complaints list is empty or null', () => {
    const { rerender } = render(<ComplaintTable complaints={[]} />);
    expect(screen.getByText('No complaints found matching current filters.')).toBeInTheDocument();

    rerender(<ComplaintTable complaints={null} />);
    expect(screen.getByText('No complaints found matching current filters.')).toBeInTheDocument();
  });

  it('renders complaint rows and data-label attributes for responsive table-card layout', () => {
    const mockComplaints = [
      {
        id: 101,
        ticketNumber: 'TICK-101',
        title: 'Network printer offline',
        category: 'TECHNICAL',
        priority: 'HIGH',
        status: 'OPEN',
        assignedTo: { id: 2, fullName: 'Agent Alice' },
        createdAt: '2026-03-15T09:30:00Z',
      },
      {
        id: 102,
        ticketNumber: 'TICK-102',
        title: 'Billing discrepancy',
        category: 'BILLING',
        priority: 'LOW',
        status: 'RESOLVED',
        assignedTo: null,
        createdAt: null,
      },
    ];

    const { container } = render(
      <MemoryRouter>
        <ComplaintTable complaints={mockComplaints} />
      </MemoryRouter>
    );

    expect(screen.getByText('TICK-101')).toBeInTheDocument();
    expect(screen.getByText('Network printer offline')).toBeInTheDocument();
    expect(screen.getByText('Agent Alice')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();

    // Check data-label attributes on cells
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const firstRowCells = rows[0].querySelectorAll('td');
    const expectedLabels = [
      'Ticket',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Assigned to',
      'Created',
      'Action',
    ];

    expectedLabels.forEach((label, idx) => {
      expect(firstRowCells[idx]).toHaveAttribute('data-label', label);
    });

    // Check links
    const links = screen.getAllByRole('link', { name: /view/i });
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', '/complaints/101');
    expect(links[1]).toHaveAttribute('href', '/complaints/102');
  });
});
