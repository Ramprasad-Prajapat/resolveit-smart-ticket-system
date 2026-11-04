import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PasswordInput from '../components/PasswordInput';

/**
 * User registration page with live password rule verification and confirm matching.
 */
export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Register - ResolveIT';
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const hasLength = password.length >= 8 && password.length <= 64;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const isPasswordValid = hasLength && hasLetter && hasDigit;
  const isMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.status === 409) {
        setError('Email is already registered. Please sign in or use another email.');
      } else if (err.status === 0 || err.message === 'Cannot reach the server.') {
        setError('Cannot reach the server.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '2.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>Create an Account</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
          Join ResolveIT to submit and track support tickets
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="regFullName" className="form-label">
              Full Name
            </label>
            <input
              id="regFullName"
              name="fullName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alice Smith"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="regEmail" className="form-label">
              Email Address
            </label>
            <input
              id="regEmail"
              name="email"
              type="email"
              required
              maxLength={150}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="regPassword" className="form-label">
              Password
            </label>
            <PasswordInput
              id="regPassword"
              name="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
            <ul className="rules-checklist">
              <li className={hasLength ? 'valid' : 'invalid'}>
                <span>{hasLength ? '✓' : '○'}</span> 8 to 64 characters
              </li>
              <li className={hasLetter ? 'valid' : 'invalid'}>
                <span>{hasLetter ? '✓' : '○'}</span> At least one letter
              </li>
              <li className={hasDigit ? 'valid' : 'invalid'}>
                <span>{hasDigit ? '✓' : '○'}</span> At least one digit
              </li>
            </ul>
          </div>

          <div className="form-group">
            <label htmlFor="regConfirmPassword" className="form-label">
              Confirm Password
            </label>
            <PasswordInput
              id="regConfirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
            {confirmPassword && (
              <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: isMatch ? '#16a34a' : '#dc2626' }}>
                {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading || !isPasswordValid || !isMatch}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
