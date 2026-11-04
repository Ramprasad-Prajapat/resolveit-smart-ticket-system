import { useAuth } from '../AuthContext';

/**
 * Metric cards summarizing complaint counts.
 * Clicking a card applies the corresponding filter on the dashboard.
 */
export default function SummaryCards({ summary, onSelectFilter }) {
  const { isStaff } = useAuth();

  if (!summary) return null;

  return (
    <div className="summary-grid">
      <div className="summary-card" onClick={() => onSelectFilter({ status: '', assignedToMe: false, unassigned: false })}>
        <div className="summary-card-title">Total</div>
        <div className="summary-card-value">{summary.total}</div>
      </div>

      <div className="summary-card" onClick={() => onSelectFilter({ status: 'OPEN', assignedToMe: false, unassigned: false })}>
        <div className="summary-card-title">Open</div>
        <div className="summary-card-value" style={{ color: 'var(--status-open)' }}>
          {summary.open}
        </div>
      </div>

      <div className="summary-card" onClick={() => onSelectFilter({ status: 'IN_PROGRESS', assignedToMe: false, unassigned: false })}>
        <div className="summary-card-title">In Progress</div>
        <div className="summary-card-value" style={{ color: 'var(--status-progress)' }}>
          {summary.inProgress}
        </div>
      </div>

      <div className="summary-card" onClick={() => onSelectFilter({ status: 'RESOLVED', assignedToMe: false, unassigned: false })}>
        <div className="summary-card-title">Resolved</div>
        <div className="summary-card-value" style={{ color: 'var(--status-resolved)' }}>
          {summary.resolved}
        </div>
      </div>

      {isStaff && (
        <>
          <div className="summary-card" onClick={() => onSelectFilter({ status: '', assignedToMe: false, unassigned: true })}>
            <div className="summary-card-title">Unassigned</div>
            <div className="summary-card-value" style={{ color: '#8b5cf6' }}>
              {summary.unassigned}
            </div>
          </div>

          <div className="summary-card" onClick={() => onSelectFilter({ status: '', assignedToMe: true, unassigned: false })}>
            <div className="summary-card-title">Assigned to Me</div>
            <div className="summary-card-value" style={{ color: '#0284c7' }}>
              {summary.assignedToMe}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
