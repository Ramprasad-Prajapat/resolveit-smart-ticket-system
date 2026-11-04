import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../components/Pagination';

describe('Pagination Component', () => {
  it('renders nothing when totalElements is 0', () => {
    const { container } = render(
      <Pagination
        page={0}
        size={10}
        totalElements={0}
        totalPages={0}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders record counts, mobile indicator, and handles page buttons', () => {
    const onPageChange = vi.fn();
    const onSizeChange = vi.fn();

    const { rerender } = render(
      <Pagination
        page={0}
        size={10}
        totalElements={45}
        totalPages={5}
        onPageChange={onPageChange}
        onSizeChange={onSizeChange}
      />
    );

    expect(screen.getByText('Showing 1–10 of 45')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toHaveClass('pagination-mobile-indicator');

    const prevBtn = screen.getByRole('button', { name: /previous/i });
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click next
    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click specific page
    const page3Btn = screen.getByRole('button', { name: '3' });
    fireEvent.click(page3Btn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Change per page select
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '20' } });
    expect(onSizeChange).toHaveBeenCalledWith(20);

    // Test last page disables Next
    rerender(
      <Pagination
        page={4}
        size={10}
        totalElements={45}
        totalPages={5}
        onPageChange={onPageChange}
        onSizeChange={onSizeChange}
      />
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
  });
});
