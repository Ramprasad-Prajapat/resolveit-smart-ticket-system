import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotification } from '../NotificationContext';
import * as api from '../api';
import StatusBadge from '../components/StatusBadge';
import CommentSection from '../components/CommentSection';
import HistoryTimeline from '../components/HistoryTimeline';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from '../constants';

/**
 * Detailed view of a single complaint with permissions-driven actions, comments, and history.
 */
export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAgent } = useAuth();
  const { showToast } = useNotification();

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    try {
      const compData = await api.getComplaint(id);
      setComplaint(compData);
      document.title = `${compData.ticketNumber} - ResolveIT`;

      if (compData.permissions?.allowedNextStatuses?.length > 0) {
        setTargetStatus(compData.permissions.allowedNextStatuses[0]);
      } else {
        setTargetStatus('');
      }

      const [commData, histData] = await Promise.all([
        api.getComments(id),
        api.getHistory(id),
      ]);
      setComments(commData);
      setHistory(histData);

      if (isAdmin) {
        const usersList = await api.getAssignableUsers();
        setAssignableUsers(usersList);
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isAdmin]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    setActionLoading(true);
    setActionError('');
    try {
      await api.updateComplaintStatus(id, targetStatus, statusNote.trim());
      setStatusNote('');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update status');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfAssign = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.assignComplaint(id, user.id);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to assign complaint');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminAssign = async (e) => {
    e.preventDefault();
    if (!selectedAssignee) return;

    const assigneeId = Number(selectedAssignee);
    const targetUser = assignableUsers.find((u) => u.id === assigneeId);
    const targetName = targetUser?.fullName || 'the selected agent';
    const oldName = complaint.assignedTo?.fullName;

    if (complaint.assignedTo) {
      const confirmed = window.confirm(`Move this complaint from ${oldName} to ${targetName}?`);
      if (!confirmed) {
        return;
      }
    }

    setActionLoading(true);
    setActionError('');
    try {
      await api.assignComplaint(id, assigneeId);
      setSelectedAssignee('');

      const titleTruncated = complaint.title && complaint.title.length > 60
        ? complaint.title.substring(0, 57) + '...'
        : complaint.title;

      const message = complaint.assignedTo
        ? `Ticket ${complaint.ticketNumber} "${titleTruncated}" was moved from ${oldName} to ${targetName}.`
        : `Ticket ${complaint.ticketNumber} "${titleTruncated}" was assigned to ${targetName}.`;

      showToast({
        type: 'INFO',
        title: 'Assignment Updated',
        message,
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint.id,
      });

      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to assign complaint');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminUnassign = async () => {
    const oldName = complaint.assignedTo?.fullName || 'the current agent';
    const confirmed = window.confirm(`Unassign this complaint from ${oldName}?`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await api.assignComplaint(id, null);
      setSelectedAssignee('');

      const titleTruncated = complaint.title && complaint.title.length > 60
        ? complaint.title.substring(0, 57) + '...'
        : complaint.title;

      showToast({
        type: 'INFO',
        title: 'Assignment Updated',
        message: `Ticket ${complaint.ticketNumber} "${titleTruncated}" was unassigned from ${oldName}.`,
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint.id,
      });

      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to unassign complaint');
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await api.deleteComplaint(id);
      navigate('/', { replace: true });
    } catch (err) {
      setActionError(err.message || 'Failed to delete complaint');
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="state-box">Loading complaint details...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="container" style={{ maxWidth: '720px' }}>
        <div className="alert alert-error">{error || 'Complaint not found.'}</div>
        <Link to="/" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const permissions = complaint.permissions || {};
  const allowedStatuses = permissions.allowedNextStatuses || [];

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container" style={{ maxWidth: '840px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          ← Back to Complaints
        </Link>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="card">
        <div className="page-header" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
                {complaint.ticketNumber}
              </span>
              <StatusBadge status={complaint.status} />
              <StatusBadge priority={complaint.priority} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>{complaint.title}</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {permissions.canEdit && (
              <Link to={`/complaints/${id}/edit`} className="btn btn-secondary btn-sm">
                Edit
              </Link>
            )}
            {permissions.canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger btn-sm"
                disabled={actionLoading}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Metadata info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Category</span>
            <strong>{CATEGORY_LABELS[complaint.category] || complaint.category}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Created By</span>
            <strong>{complaint.createdBy?.fullName || 'Unknown'}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Assigned To</span>
            <strong>{complaint.assignedTo?.fullName || 'Unassigned'}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280', display: 'block' }}>Created At</span>
            <span>{formatDateTime(complaint.createdAt)}</span>
          </div>
          {complaint.resolvedAt && (
            <div>
              <span style={{ color: '#6b7280', display: 'block' }}>Resolved At</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatDateTime(complaint.resolvedAt)}</span>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.6' }}>{complaint.description}</p>
        </div>

        {/* Action Controls: Assignment & Status Updates */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          {/* Assignment controls */}
          {isAdmin && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#4b5563' }}>
                Currently assigned to: <strong>{complaint.assignedTo?.fullName || 'Unassigned'}</strong>
              </div>
              <form onSubmit={handleAdminAssign} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label htmlFor="adminAssignSelect" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Assignee:
                </label>
                <select
                  id="adminAssignSelect"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto' }}
                >
                  <option value="">-- Choose Agent/Admin --</option>
                  {assignableUsers
                    .filter((u) => u.id !== complaint.assignedTo?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={actionLoading || !selectedAssignee}
                >
                  {complaint.assignedTo ? 'Reassign' : 'Assign'}
                </button>
                {complaint.assignedTo && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAdminUnassign}
                    disabled={actionLoading}
                  >
                    Unassign
                  </button>
                )}
              </form>
            </div>
          )}

          {isAgent && permissions.canAssign && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSelfAssign}
                disabled={actionLoading}
              >
                Assign to me
              </button>
            </div>
          )}

          {/* Status update controls */}
          {allowedStatuses.length > 0 && (
            <form onSubmit={handleStatusChange} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="nextStatusSelect" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Next Status:
              </label>
              <select
                id="nextStatusSelect"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="form-select"
                style={{ width: 'auto' }}
                required
              >
                {allowedStatuses.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Optional transition note..."
                value={statusNote}
                maxLength={255}
                onChange={(e) => setStatusNote(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: '180px' }}
              />

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={actionLoading || !targetStatus}
              >
                {actionLoading ? 'Updating...' : targetStatus === 'OPEN' && complaint.status === 'RESOLVED' ? 'Reopen Complaint' : 'Update Status'}
              </button>
            </form>
          )}
        </div>
      </div>

      <CommentSection complaintId={id} comments={comments} onCommentAdded={loadData} />
      <HistoryTimeline history={history} />
    </div>
  );
}
