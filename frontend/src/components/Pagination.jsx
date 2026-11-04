/**
 * Pagination bar with page buttons, size selector, and record counters.
 */
export default function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange }) {
  if (totalElements === 0) return null;

  const startRecord = page * size + 1;
  const endRecord = Math.min((page + 1) * size, totalElements);

  // Generate simple page button range
  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(0, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination">
      <div>
        Showing {startRecord}–{endRecord} of {totalElements}
      </div>

      <div className="pagination-controls">
        <label style={{ marginRight: '0.75rem', fontSize: '0.85rem' }}>
          Per page:
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', display: 'inline-block', marginLeft: '0.35rem', padding: '0.2rem 0.5rem' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span className="pagination-mobile-indicator">
          Page {page + 1} of {totalPages}
        </span>

        {pageNumbers.map((num) => (
          <button
            key={num}
            type="button"
            className={`btn btn-sm pagination-page-btn ${num === page ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onPageChange(num)}
          >
            {num + 1}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
