import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PasswordInput from '../components/PasswordInput';

/**
 * User login page with credentials form and clear error handling.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Login - ResolveIT';
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setError('Invalid email or password');
      } else if (err.status === 403) {
        setError('Your account is deactivated');
      } else if (err.status === 429) {
        setError(err.message || 'Too many failed login attempts. Try again later.');
      } else if (err.status === 0 || err.message === 'Cannot reach the server.') {
        setError('Cannot reach the server.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '3rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>ResolveIT</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
          Sign in to manage and track your complaints
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail" className="form-label">
              Email Address
            </label>
            <input
              id="loginEmail"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword" className="form-label">
              Password
            </label>
            <PasswordInput
              id="loginPassword"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
