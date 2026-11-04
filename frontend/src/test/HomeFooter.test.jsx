import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeFooter from '../components/HomeFooter';
import { siteInfo } from '../siteInfo';

describe('HomeFooter Component', () => {
  beforeEach(() => {
    siteInfo.contactEmail = '';
    siteInfo.githubUrl = '';
    siteInfo.linkedinUrl = '';
  });

  it('renders the 4 main columns and hides Contact when siteInfo is empty', () => {
    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 3, name: /^ResolveIT$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^Quick Links$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^Account$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^Who uses it$/i })).toBeInTheDocument();

    // Contact column should be absent
    expect(screen.queryByRole('heading', { level: 3, name: /^Contact$/i })).toBeNull();
  });

  it('renders quick links with exact anchor href values', () => {
    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    const quickLinksNav = screen.getByRole('navigation', { name: /Footer/i });
    expect(quickLinksNav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /^Home$/i })).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: /^Features$/i })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: /^How It Works$/i })).toHaveAttribute('href', '#how-it-works');
    expect(screen.getByRole('link', { name: /^Roles$/i })).toHaveAttribute('href', '#roles');
  });

  it('renders account links to /login and /register', () => {
    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    const loginLink = screen.getByRole('link', { name: /^Login$/i });
    expect(loginLink).toHaveAttribute('href', '/login');

    const registerLink = screen.getByRole('link', { name: /^Create account$/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders role shortcut links targeting #roles', () => {
    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    const userRoleLink = screen.getByRole('link', { name: /Users — raise and track complaints/i });
    expect(userRoleLink).toHaveAttribute('href', '#roles');

    const agentRoleLink = screen.getByRole('link', { name: /Agents — pick up and resolve complaints/i });
    expect(agentRoleLink).toHaveAttribute('href', '#roles');

    const adminRoleLink = screen.getByRole('link', { name: /Admins — manage complaints and users/i });
    expect(adminRoleLink).toHaveAttribute('href', '#roles');
  });

  it('renders current year and Back to top link targeting #home', () => {
    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear} ResolveIT`, 'i'))).toBeInTheDocument();

    const backToTop = screen.getByRole('link', { name: /Back to top/i });
    expect(backToTop).toHaveAttribute('href', '#home');
  });

  it('displays Contact column and populated links when siteInfo is provided', () => {
    siteInfo.contactEmail = 'dev@resolveit.local';
    siteInfo.githubUrl = 'https://github.com/example/resolveit';
    // linkedinUrl left empty intentionally

    render(
      <BrowserRouter>
        <HomeFooter />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 3, name: /^Contact$/i })).toBeInTheDocument();

    const emailLink = screen.getByRole('link', { name: 'dev@resolveit.local' });
    expect(emailLink).toHaveAttribute('href', 'mailto:dev@resolveit.local');

    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/example/resolveit');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull();
  });
});
