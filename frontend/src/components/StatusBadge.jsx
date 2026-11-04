import { STATUS_LABELS, PRIORITY_LABELS } from '../constants';

/**
 * Visual badge for Complaint Status or Priority.
 */
export default function StatusBadge({ status, priority, role }) {
  if (status) {
    const cleanStatus = status.toLowerCase();
    const label = STATUS_LABELS[status] || status;
    return <span className={`badge badge-status-${cleanStatus}`}>{label}</span>;
  }

  if (priority) {
    const cleanPriority = priority.toLowerCase();
    const label = PRIORITY_LABELS[priority] || priority;
    return <span className={`badge badge-priority-${cleanPriority}`}>{label}</span>;
  }

  if (role) {
    const cleanRole = role.toLowerCase();
    return <span className={`badge badge-role-${cleanRole}`}>{role}</span>;
  }

  return null;
}
