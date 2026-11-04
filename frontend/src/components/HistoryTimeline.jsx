import StatusBadge from './StatusBadge';

/**
 * Audit timeline displaying chronological status transitions for a complaint.
 */
export default function HistoryTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.15rem' }}>Status History</h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No history entries available.</p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Status History</h3>
      <ul className="timeline">
        {history.map((h) => (
          <li key={h.id} className="timeline-item">
            <div className="timeline-meta">
              <strong>{h.changedBy?.fullName || 'System'}</strong> on {formatDate(h.changedAt)}
            </div>
            <div className="timeline-content" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {h.oldStatus && h.oldStatus === h.newStatus ? (
                <span style={{ fontWeight: 600, color: '#374151' }}>Assignment changed</span>
              ) : h.oldStatus ? (
                <>
                  <StatusBadge status={h.oldStatus} />
                  <span>→</span>
                  <StatusBadge status={h.newStatus} />
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Created as</span>
                  <StatusBadge status={h.newStatus} />
                </>
              )}
              {h.note && (
                <span style={{ color: '#4b5563', fontStyle: 'italic', marginLeft: '0.25rem' }}>
                  — &ldquo;{h.note}&rdquo;
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
