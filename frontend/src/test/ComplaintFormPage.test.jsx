import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComplaintFormPage from '../pages/ComplaintFormPage';
import * as api from '../api';

vi.mock('../api');

describe('ComplaintFormPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create complaint form and validates minimum input lengths', async () => {
    render(
      <MemoryRouter initialEntries={['/complaints/new']}>
        <Routes>
          <Route path="/complaints/new" element={<ComplaintFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Submit a New Complaint')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole('button', { name: /submit complaint/i });

    // Enter short title (< 3 chars) and short desc (< 10 chars)
    fireEvent.change(titleInput, { target: { value: 'ab' } });
    fireEvent.change(descInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Title must be 3 to 100 characters')).toBeInTheDocument();
    expect(screen.getByText('Description must be 10 to 2000 characters')).toBeInTheDocument();
    expect(api.createComplaint).not.toHaveBeenCalled();
  });

  it('submits valid complaint and calls api.createComplaint', async () => {
    api.createComplaint.mockResolvedValue({ id: 55, title: 'Valid issue title' });

    render(
      <MemoryRouter initialEntries={['/complaints/new']}>
        <Routes>
          <Route path="/complaints/new" element={<ComplaintFormPage />} />
          <Route path="/complaints/:id" element={<div>Complaint Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole('button', { name: /submit complaint/i });

    fireEvent.change(titleInput, { target: { value: 'Valid Complaint Title' } });
    fireEvent.change(descInput, {
      target: { value: 'This is a sufficiently long description that satisfies the length rule.' },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createComplaint).toHaveBeenCalledWith({
        title: 'Valid Complaint Title',
        description: 'This is a sufficiently long description that satisfies the length rule.',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
      });
      expect(screen.getByText('Complaint Detail Page')).toBeInTheDocument();
    });
  });

  it('populates fields in edit mode and updates existing complaint', async () => {
    api.getComplaint.mockResolvedValue({
      id: 42,
      title: 'Existing broken server',
      description: 'The server has been unresponsive since yesterday morning.',
      category: 'TECHNICAL',
      priority: 'HIGH',
    });
    api.updateComplaint.mockResolvedValue({ id: 42 });

    render(
      <MemoryRouter initialEntries={['/complaints/42/edit']}>
        <Routes>
          <Route path="/complaints/:id/edit" element={<ComplaintFormPage />} />
          <Route path="/complaints/:id" element={<div>Complaint Detail 42</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing broken server')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('The server has been unresponsive since yesterday morning.')
      ).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Existing broken server');
    fireEvent.change(titleInput, { target: { value: 'Updated server title' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateComplaint).toHaveBeenCalledWith('42', {
        title: 'Updated server title',
        description: 'The server has been unresponsive since yesterday morning.',
        category: 'TECHNICAL',
        priority: 'HIGH',
      });
      expect(screen.getByText('Complaint Detail 42')).toBeInTheDocument();
    });
  });
});
