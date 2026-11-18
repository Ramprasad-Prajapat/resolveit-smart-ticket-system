// Public footer with real site links and role shortcuts.
import { Link } from 'react-router-dom';

export default function HomeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <nav aria-label="Footer" className="home-footer-nav">
          <div className="home-footer-grid home-footer-grid-4">
            {/* Column 1: Brand */}
            <div className="home-footer-col home-footer-col-brand">
              <h3 className="home-footer-col-title">ResolveIT</h3>
              <p className="home-footer-col-text">
                A simple complaint and ticket management system. Raise a complaint, track its status, and get it resolved.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="home-footer-col">
              <h3 className="home-footer-col-title">Quick Links</h3>
              <ul className="home-footer-links">
                <li>
                  <a href="#home">Home</a>
                </li>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#how-it-works">How It Works</a>
                </li>
                <li>
                  <a href="#roles">Roles</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Account */}
            <div className="home-footer-col">
              <h3 className="home-footer-col-title">Account</h3>
              <ul className="home-footer-links">
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Create account</Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Who uses it */}
            <div className="home-footer-col">
              <h3 className="home-footer-col-title">Who uses it</h3>
              <ul className="home-footer-links">
                <li>
                  <a href="#roles">Users — raise and track complaints</a>
                </li>
                <li>
                  <a href="#roles">Agents — pick up and resolve complaints</a>
                </li>
                <li>
                  <a href="#roles">Admins — manage complaints and users</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Bottom bar */}
        <div className="home-footer-bottom">
          <span className="home-footer-copyright">
            © {currentYear} ResolveIT. All rights reserved.
          </span>
          <a href="#home" className="home-footer-back-to-top">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
