import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import * as api from '../api';
import StatusBadge from '../components/StatusBadge';
import { ROLES } from '../constants';

/**
 * Admin portal for managing user accounts, promoting roles, and toggling active status.
 */
export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    document.title = 'User Management - ResolveIT';
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateUserRole(targetUserId, newRole);
      setSuccess('User role updated successfully');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActiveToggle = async (targetUser) => {
    const actionName = targetUser.active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} this user account?`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateUserActive(targetUser.id, !targetUser.active);
      setSuccess(`User account ${actionName}d successfully`);
      await loadUsers();
    } catch (err) {
      setError(err.message || `Failed to ${actionName} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage staff privileges and account activity
          </p>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Filters */}
        <div className="filters-bar" style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input filter-search"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Roles</option>
            {Object.keys(ROLES).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="state-box">Loading users...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id}>
                      <td data-label="User">
                        <strong>{u.fullName}</strong>
                        {isSelf && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.4rem' }}>
                            (You)
                          </span>
                        )}
                      </td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="Current Role">
                        <StatusBadge role={u.role} />
                      </td>
                      <td data-label="Status">
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: u.active ? '#f0fdf4' : '#fef2f2',
                            color: u.active ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td data-label="Joined">{formatDate(u.createdAt)}</td>
                      <td data-label="Change Role">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={actionLoading || isSelf}
                          className="form-select"
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                        >
                          {Object.keys(ROLES).map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Action">
                        <button
                          type="button"
                          onClick={() => handleActiveToggle(u)}
                          disabled={actionLoading || isSelf}
                          className={`btn btn-sm ${u.active ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
