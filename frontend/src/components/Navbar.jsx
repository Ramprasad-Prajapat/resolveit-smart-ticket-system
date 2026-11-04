import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import StatusBadge from './StatusBadge';

/**
 * Top navigation bar with links, user role indicator, and logout button.
 * Fully responsive with accessible mobile hamburger menu.
 */
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogoutClick = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleToggleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand" onClick={() => setIsOpen(false)}>
        ResolveIT
      </Link>

      <button
        type="button"
        className="nav-toggle-btn"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        onClick={toggleMenu}
        onKeyDown={handleToggleKeyDown}
      >
        <span className="hamburger-icon" aria-hidden="true">
          {isOpen ? '✕' : '☰'}
        </span>
      </button>

      <div className={`nav-menu-collapsible ${isOpen ? 'nav-menu-open' : ''}`}>
        <nav className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
            onClick={() => setIsOpen(false)}
          >
            Complaints
          </NavLink>
          <NavLink
            to="/complaints/new"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            New Complaint
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              Users
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          <Link
            to="/profile"
            className="nav-username"
            title="View Profile"
            onClick={() => setIsOpen(false)}
          >
            {user?.fullName}
          </Link>
          <StatusBadge role={user?.role} />
          <button type="button" onClick={handleLogoutClick} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
