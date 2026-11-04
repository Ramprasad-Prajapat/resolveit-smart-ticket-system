import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import * as api from '../api';
import PasswordInput from '../components/PasswordInput';
import StatusBadge from '../components/StatusBadge';

/**
 * User profile view for changing name or updating account password.
 */
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    document.title = 'Profile - ResolveIT';
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      setProfileError('Full name must be 2 to 100 characters');
      return;
    }

    setProfileLoading(true);
    try {
      const updated = await api.updateProfile(fullName.trim());
      refreshUser(updated);
      setProfileSuccess('Full name updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const hasLength = newPassword.length >= 8 && newPassword.length <= 64;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const isNewPasswordValid = hasLength && hasLetter && hasDigit;
  const isMatch = newPassword === confirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!isNewPasswordValid) {
      setPasswordError('New password does not fulfill all requirements.');
      return;
    }

    if (!isMatch) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container" style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
      </div>

      {/* Account Info Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Account Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Email Address</span>
            <strong>{user?.email}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Role</span>
            <StatusBadge role={user?.role} />
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Member Since</span>
            <span>{formatDate(user?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Change Name Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Update Display Name</h2>
        {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
        {profileError && <div className="alert alert-error">{profileError}</div>}

        <form onSubmit={handleUpdateName}>
          <div className="form-group">
            <label htmlFor="profileFullName" className="form-label">
              Full Name
            </label>
            <input
              id="profileFullName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Update Name'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Change Password</h2>
        {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
        {passwordError && <div className="alert alert-error">{passwordError}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="currentPassword" className="form-label">
              Current Password
            </label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
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
            <label htmlFor="confirmNewPassword" className="form-label">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirmNewPassword"
              name="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
            />
            {confirmPassword && (
              <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: isMatch ? '#16a34a' : '#dc2626' }}>
                {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={passwordLoading || !isNewPasswordValid || !isMatch || !currentPassword}
          >
            {passwordLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
