import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from '../components/PasswordInput';

describe('PasswordInput Component', () => {
  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput id="pwd" value="Secret123" onChange={() => {}} />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    expect(toggleBtn).toHaveAttribute('type', 'button');

    await user.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    await user.click(hideBtn);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('never submits the containing form when clicked', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <PasswordInput id="test-pwd" value="test" onChange={() => {}} />
        <button type="submit">Submit Form</button>
      </form>
    );

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
