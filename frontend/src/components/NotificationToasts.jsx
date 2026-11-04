// Notification popups floating at the top-center of the screen.
import { Link } from 'react-router-dom';
import { useNotification } from '../NotificationContext';

export default function NotificationToasts() {
  const { toasts, dismissToast } = useNotification();

  if (!toasts || toasts.length === 0) {
    return null;
  }

  const getTypeClass = (type) => {
    switch (type) {
      case 'ASSIGNED_TO_YOU':
        return 'toast-assigned';
      case 'REASSIGNED_FROM_YOU':
        return 'toast-reassigned';
      case 'UNASSIGNED_FROM_YOU':
        return 'toast-unassigned';
      default:
        return 'toast-info';
    }
  };

  return (
    <aside aria-label="Notifications" aria-live="polite" className="toast-container">
      {toasts.map((toast) => {
        const typeClass = getTypeClass(toast.type);
        return (
          <div key={toast.id} role="status" className={`toast-card ${typeClass}`}>
            <div className="toast-header">
              <div className="toast-title-row">
                <span className="toast-badge-dot" aria-hidden="true"></span>
                <strong className="toast-title">{toast.title}</strong>
              </div>
              <button
                type="button"
                className="toast-close-btn"
                aria-label="Close notification"
                onClick={() => dismissToast(toast.id)}
              >
                ✕
              </button>
            </div>

            <div className="toast-body">
              {toast.ticketNumber && (
                <div className="toast-ticket-code">
                  <strong>{toast.ticketNumber}</strong>
                </div>
              )}
              <p className="toast-message">{toast.message}</p>
            </div>

            <div className="toast-actions">
              {toast.complaintId && (
                <Link
                  to={`/complaints/${toast.complaintId}`}
                  className="toast-link"
                  onClick={() => dismissToast(toast.id)}
                >
                  View complaint →
                </Link>
              )}
              <button
                type="button"
                className="btn btn-sm toast-ok-btn"
                onClick={() => dismissToast(toast.id)}
              >
                OK
              </button>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
