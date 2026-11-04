// Public landing page explaining ResolveIT features, workflow, roles, and guidelines.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import HomeFooter from '../components/HomeFooter';
import '../home.css';

export default function HomePage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'ResolveIT · Complaint & Ticket Management';
    document.documentElement.classList.add('home-smooth');

    // Handle hash scrolling on direct navigation
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView();
      }
    }

    return () => {
      document.title = prevTitle;
      document.documentElement.classList.remove('home-smooth');
    };
  }, []);

  return (
    <div className="home-page">
      <HomeNavbar />

      <main>
        {/* Section 1: Hero */}
        <section id="home" aria-labelledby="home-hero-title" className="home-section home-hero">
          <div className="home-hero-content">
            <h1 id="home-hero-title" className="home-hero-title">
              Raise, track and resolve complaints in one place.
            </h1>
            <p className="home-hero-desc">
              ResolveIT gives teams, students, and residents a clear, accountable platform to submit service issues
              and track resolutions.
            </p>
            <div className="home-hero-actions">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" aria-labelledby="features-title" className="home-section">
          <div className="home-container">
            <div className="home-section-header">
              <h2 id="features-title" className="home-section-title">
                Features
              </h2>
              <p className="home-section-subtitle">
                Everything you need to manage and resolve complaints without confusion.
              </p>
            </div>

            <div className="home-features-grid">
              <div className="home-feature-card">
                <h3 className="home-feature-title">Secure sign up and login</h3>
                <p className="home-feature-desc">
                  Hashed passwords, JWT token.
                </p>
              </div>

              <div className="home-feature-card">
                <h3 className="home-feature-title">Raise and track complaints</h3>
                <p className="home-feature-desc">
                  Edit or delete while still Open.
                </p>
              </div>

              <div className="home-feature-card">
                <h3 className="home-feature-title">Search, filters, sorting and pages</h3>
                <p className="home-feature-desc">
                  Find complaints quickly by keywords, status, category, sorting, and pagination.
                </p>
              </div>

              <div className="home-feature-card">
                <h3 className="home-feature-title">Assign complaints to agents</h3>
                <p className="home-feature-desc">
                  Assign unassigned complaints to support agents.
                </p>
              </div>

              <div className="home-feature-card">
                <h3 className="home-feature-title">Comments and full status history</h3>
                <p className="home-feature-desc">
                  Discuss details in comments and inspect the complete status transition history.
                </p>
              </div>

              <div className="home-feature-card">
                <h3 className="home-feature-title">Profile, password change and login protection</h3>
                <p className="home-feature-desc">
                  Account locks after too many wrong passwords.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="how-it-works" aria-labelledby="how-it-works-title" className="home-section home-section-alt">
          <div className="home-container">
            <div className="home-section-header">
              <h2 id="how-it-works-title" className="home-section-title">
                How It Works
              </h2>
              <p className="home-section-subtitle">
                A simple four-step journey from issue discovery to confirmed resolution.
              </p>
            </div>

            <div className="home-steps-grid">
              <div className="home-step-card">
                <span className="home-step-number">1</span>
                <h3 className="home-step-title">Create an account and log in</h3>
                <p className="home-step-desc">
                  Register with your email and sign in to get started.
                </p>
              </div>

              <div className="home-step-card">
                <span className="home-step-number">2</span>
                <h3 className="home-step-title">Raise a complaint</h3>
                <p className="home-step-desc">
                  Submit your issue with a title, category, priority, and description.
                </p>
              </div>

              <div className="home-step-card">
                <span className="home-step-number">3</span>
                <h3 className="home-step-title">An agent takes it and updates the status</h3>
                <p className="home-step-desc">
                  An agent assigns the ticket and moves it to In Progress while working on it.
                </p>
              </div>

              <div className="home-step-card">
                <span className="home-step-number">4</span>
                <h3 className="home-step-title">Resolved (reopen if it is not fixed)</h3>
                <p className="home-step-desc">
                  The ticket is marked Resolved, and you can reopen it if the issue persists.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Roles */}
        <section id="roles" aria-labelledby="roles-title" className="home-section">
          <div className="home-container">
            <div className="home-section-header">
              <h2 id="roles-title" className="home-section-title">
                Roles and Permissions
              </h2>
              <p className="home-section-subtitle">
                Role-based access rules ensure clarity and security across every ticket.
              </p>
            </div>

            <div className="home-roles-grid">
              <div className="home-role-card">
                <h3 className="home-role-name">User</h3>
                <p className="home-role-desc">
                  Raise complaints, see only own complaints, edit or delete while Open, comment, reopen a resolved complaint.
                </p>
              </div>

              <div className="home-role-card">
                <h3 className="home-role-name">Agent</h3>
                <p className="home-role-desc">
                  See all complaints, assign an unassigned complaint to self, update the status of own assigned complaints, comment.
                </p>
              </div>

              <div className="home-role-card">
                <h3 className="home-role-name">Admin</h3>
                <p className="home-role-desc">
                  Everything an agent can do, plus assign to anyone, change any status, delete any complaint, and manage users (change role, activate or deactivate).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Section 5: Footer */}
      <HomeFooter />
    </div>
  );
}
