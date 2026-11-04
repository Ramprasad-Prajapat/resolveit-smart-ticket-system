import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { CATEGORY_LABELS } from '../constants';

/**
 * Tabular display of complaints with badges and direct view link.
 */
export default function ComplaintTable({ complaints }) {
  if (!complaints || complaints.length === 0) {
    return (
      <div className="state-box">
        <p>No complaints found matching current filters.</p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((item) => (
            <tr key={item.id}>
              <td data-label="Ticket">
                <strong>{item.ticketNumber}</strong>
              </td>
              <td data-label="Title">
                <Link to={`/complaints/${item.id}`} style={{ fontWeight: 500 }}>
                  {item.title}
                </Link>
              </td>
              <td data-label="Category">{CATEGORY_LABELS[item.category] || item.category}</td>
              <td data-label="Priority">
                <StatusBadge priority={item.priority} />
              </td>
              <td data-label="Status">
                <StatusBadge status={item.status} />
              </td>
              <td data-label="Assigned to">{item.assignedTo ? item.assignedTo.fullName : <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
              <td data-label="Created">{formatDate(item.createdAt)}</td>
              <td data-label="Action">
                <Link to={`/complaints/${item.id}`} className="btn btn-secondary btn-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
