import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

describe('HomePage Component', () => {
  it('renders exactly one h1 element', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    expect(h1Headings).toHaveLength(1);
    expect(h1Headings[0]).toHaveTextContent(/Raise, track and resolve complaints in one place/i);
  });

  it('contains the 4 required section ids and no technology section', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const requiredIds = ['home', 'features', 'how-it-works', 'roles'];
    requiredIds.forEach((id) => {
      const section = document.getElementById(id);
      expect(section).not.toBeNull();
    });

    expect(document.getElementById('technology')).toBeNull();
  });

  it('does not contain removed or untrue text', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const text = document.body.textContent;
    expect(text).not.toMatch(/Ticket Lifecycle/i);
    expect(text).not.toMatch(/Ready to try it/i);
    expect(text).not.toMatch(/Real-Time Feedback/i);
  });

  it('renders exactly 6 feature cards with expected titles', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const expectedTitles = [
      'Secure sign up and login',
      'Raise and track complaints',
      'Search, filters, sorting and pages',
      'Assign complaints to agents',
      'Comments and full status history',
      'Profile, password change and login protection',
    ];

    expectedTitles.forEach((title) => {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    });

    const featureCards = document.querySelectorAll('.home-feature-card');
    expect(featureCards).toHaveLength(6);
  });

  it('renders hero Get Started button linking to /register', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const getStartedLink = screen.getByRole('link', { name: /^Get Started$/i });
    expect(getStartedLink).toHaveAttribute('href', '/register');
  });

  it('does not contain any demo credentials text', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const bodyText = document.body.textContent;
    expect(bodyText).not.toMatch(/Demo@1234/i);
    expect(bodyText).not.toMatch(/admin@resolveit/i);
    expect(bodyText).not.toMatch(/agent1@resolveit/i);
    expect(bodyText).not.toMatch(/user1@resolveit/i);
  });
});
