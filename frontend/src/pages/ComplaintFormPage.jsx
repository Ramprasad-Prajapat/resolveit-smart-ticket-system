import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as api from '../api';
import {
  COMPLAINT_CATEGORY,
  CATEGORY_LABELS,
  COMPLAINT_PRIORITY,
  PRIORITY_LABELS,
} from '../constants';

/**
 * Form for submitting a new complaint or editing an existing open complaint.
 */
export default function ComplaintFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(COMPLAINT_CATEGORY.TECHNICAL);
  const [priority, setPriority] = useState(COMPLAINT_PRIORITY.MEDIUM);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    document.title = isEdit ? 'Edit Complaint - ResolveIT' : 'New Complaint - ResolveIT';

    if (isEdit) {
      api.getComplaint(id)
        .then((data) => {
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setPriority(data.priority);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load complaint details.');
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client validation matching backend requirements
    const errors = {};
    if (title.trim().length < 3 || title.trim().length > 100) {
      errors.title = 'Title must be 3 to 100 characters';
    }
    if (description.trim().length < 10 || description.trim().length > 2000) {
      errors.description = 'Description must be 10 to 2000 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    };

    try {
      if (isEdit) {
        await api.updateComplaint(id, payload);
        navigate(`/complaints/${id}`);
      } else {
        const created = await api.createComplaint(payload);
        navigate(`/complaints/${created.id}`);
      }
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setError(err.message || 'Failed to save complaint');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="state-box">Loading complaint form...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem' }}>{isEdit ? 'Edit Complaint' : 'Submit a New Complaint'}</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Provide clear details so our support staff can investigate promptly.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="complaintTitle" className="form-label">
              Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="complaintTitle"
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue (3 to 100 characters)"
              className="form-input"
            />
            {fieldErrors.title && (
              <p className="form-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.title}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label htmlFor="complaintCategory" className="form-label">
                Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="complaintCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                required
              >
                {Object.keys(COMPLAINT_CATEGORY).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="complaintPriority" className="form-label">
                Priority <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="complaintPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-select"
                required
              >
                {Object.keys(COMPLAINT_PRIORITY).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="complaintDesc" className="form-label">
              Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="complaintDesc"
              required
              minLength={10}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail, including steps to reproduce (10 to 2000 characters)..."
              className="form-textarea"
            />
            {fieldErrors.description && (
              <p className="form-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.description}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Complaint'}
            </button>
            <Link to={isEdit ? `/complaints/${id}` : '/'} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
