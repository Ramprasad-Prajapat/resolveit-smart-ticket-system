import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'roles', label: 'Roles' },
];

/**
 * Public navigation bar for visitors with section scroll links and a Login button.
 */
export default function HomeNavbar() {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return;
    }

    const sectionElements = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLinkClick = (id) => {
    setActiveSection(id);
    setMenuOpen(false);
  };

  return (
    <header className="home-navbar">
      <div className="home-nav-container">
        <a
          href="#home"
          className="home-nav-brand"
          onClick={() => handleLinkClick('home')}
        >
          ResolveIT
        </a>

        <button
          type="button"
          className="home-nav-toggle"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="home-nav-toggle-bar"></span>
          <span className="home-nav-toggle-bar"></span>
          <span className="home-nav-toggle-bar"></span>
        </button>

        <nav aria-label="Main" className={`home-nav-menu ${menuOpen ? 'home-nav-menu-open' : ''}`}>
          <ul className="home-nav-links">
            {NAV_ITEMS.map(({ id, label }) => {
              const isActive = activeSection === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`home-nav-link ${isActive ? 'home-nav-link-active' : ''}`}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={() => handleLinkClick(id)}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="home-nav-actions">
          <Link to="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
