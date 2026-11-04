import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';

describe('HomeNavbar Component', () => {
  it('renders all 4 section scroll links with exact href values and no Technology link', () => {
    render(
      <BrowserRouter>
        <HomeNavbar />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /^Home$/i })).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: /^Features$/i })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: /^How It Works$/i })).toHaveAttribute('href', '#how-it-works');
    expect(screen.getByRole('link', { name: /^Roles$/i })).toHaveAttribute('href', '#roles');
    expect(screen.queryByRole('link', { name: /^Technology$/i })).toBeNull();
  });

  it('renders Login button linking to /login', () => {
    render(
      <BrowserRouter>
        <HomeNavbar />
      </BrowserRouter>
    );

    const loginLink = screen.getByRole('link', { name: /^Login$/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('toggles hamburger menu aria-expanded state on click', () => {
    render(
      <BrowserRouter>
        <HomeNavbar />
      </BrowserRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /Open menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu when any navigation link is clicked', () => {
    render(
      <BrowserRouter>
        <HomeNavbar />
      </BrowserRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    const featuresLink = screen.getByRole('link', { name: /^Features$/i });
    fireEvent.click(featuresLink);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
