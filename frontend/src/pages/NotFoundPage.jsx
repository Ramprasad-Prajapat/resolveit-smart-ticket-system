import { Link } from 'react-router-dom';

/**
 * 404 Fallback page for unmatched client URLs.
 */
export default function NotFoundPage() {
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <div className="card" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ color: '#6b7280', margin: '1rem 0 1.5rem' }}>
          The requested page does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
