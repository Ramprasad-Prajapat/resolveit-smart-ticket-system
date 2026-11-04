import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import * as api from '../api';
import SummaryCards from '../components/SummaryCards';
import ComplaintTable from '../components/ComplaintTable';
import Pagination from '../components/Pagination';
import {
  COMPLAINT_STATUS,
  STATUS_LABELS,
  COMPLAINT_CATEGORY,
  CATEGORY_LABELS,
  COMPLAINT_PRIORITY,
  PRIORITY_LABELS,
  SORT_OPTIONS,
} from '../constants';

/**
 * Main dashboard displaying summary counts, search/filters, and paginated complaint table.
 */
export default function DashboardPage() {
  const { isStaff } = useAuth();

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('createdAt,desc');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [unassigned, setUnassigned] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Data state
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard - ResolveIT';
  }, []);

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load summary metrics
  const loadSummary = async () => {
    try {
      const data = await api.getComplaintSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary counts:', err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Fetch complaints with race condition protection
  const fetchComplaints = () => {
    let ignore = false;
    setLoading(true);
    setError('');

    const params = {
      page,
      size,
      sort,
      search: debouncedSearch.trim(),
      status,
      category,
      priority,
      assignedToMe: isStaff && assignedToMe ? true : undefined,
      unassigned: isStaff && unassigned ? true : undefined,
    };

    api.getComplaints(params)
      .then((data) => {
        if (!ignore) {
          setComplaints(data.content);
          setTotalElements(data.totalElements);
          setTotalPages(data.totalPages);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load complaints');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  };

  useEffect(() => {
    const cleanup = fetchComplaints();
    return cleanup;
  }, [page, size, sort, debouncedSearch, status, category, priority, assignedToMe, unassigned]);

  const handleFilterCardClick = (filters) => {
    if (filters.status !== undefined) setStatus(filters.status);
    if (filters.assignedToMe !== undefined) setAssignedToMe(filters.assignedToMe);
    if (filters.unassigned !== undefined) setUnassigned(filters.unassigned);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setCategory('');
    setPriority('');
    setSort('createdAt,desc');
    setAssignedToMe(false);
    setUnassigned(false);
    setPage(0);
  };

  const hasActiveFilters =
    search || status || category || priority || sort !== 'createdAt,desc' || assignedToMe || unassigned;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaint Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Track and resolve service tickets
          </p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          + New Complaint
        </Link>
      </div>

      <SummaryCards summary={summary} onSelectFilter={handleFilterCardClick} />

      <div className="card">
        {/* Filters Bar */}
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search title or ticket (e.g. RIT-00001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input filter-search"
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Statuses</option>
            {Object.keys(COMPLAINT_STATUS).map((st) => (
              <option key={st} value={st}>
                {STATUS_LABELS[st]}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Categories</option>
            {Object.keys(COMPLAINT_CATEGORY).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(0);
            }}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Priorities</option>
            {Object.keys(COMPLAINT_PRIORITY).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            className="form-select"
            style={{ width: 'auto' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isStaff && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label htmlFor="assignedToMeFilter" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  id="assignedToMeFilter"
                  type="checkbox"
                  checked={assignedToMe}
                  onChange={(e) => {
                    setAssignedToMe(e.target.checked);
                    if (e.target.checked) setUnassigned(false);
                    setPage(0);
                  }}
                />
                Assigned to me
              </label>

              <label htmlFor="unassignedFilter" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  id="unassignedFilter"
                  type="checkbox"
                  checked={unassigned}
                  onChange={(e) => {
                    setUnassigned(e.target.checked);
                    if (e.target.checked) setAssignedToMe(false);
                    setPage(0);
                  }}
                />
                Unassigned
              </label>
            </div>
          )}

          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="btn btn-secondary btn-sm">
              Clear Filters
            </button>
          )}
        </div>

        {/* Content Table State */}
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchComplaints}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="state-box">Loading complaints...</div>
        ) : (
          <>
            <ComplaintTable complaints={complaints} />
            <Pagination
              page={page}
              size={size}
              totalElements={totalElements}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
