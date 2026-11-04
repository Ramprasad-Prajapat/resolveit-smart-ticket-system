import { useState } from 'react';
import * as api from '../api';

/**
 * Comments list and message input form for a complaint.
 */
export default function CommentSection({ complaintId, comments, onCommentAdded }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.addComment(complaintId, message.trim());
      setMessage('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

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
      <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Comments</h3>

      {error && <div className="alert alert-error">{error}</div>}

      {comments && comments.length > 0 ? (
        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-card">
              <div className="comment-header">
                <span className="comment-author">{c.author.fullName}</span>
                <span className="comment-date">{formatDate(c.createdAt)}</span>
              </div>
              <div style={{ fontSize: '0.925rem', whiteSpace: 'pre-wrap' }}>{c.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          No comments yet. Leave a note below.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div className="form-group">
          <label htmlFor="commentInput" className="form-label">
            Add a Comment
          </label>
          <textarea
            id="commentInput"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message or update here (up to 1000 characters)..."
            required
            maxLength={1000}
            className="form-textarea"
            style={{ minHeight: '80px' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting || !message.trim()}>
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}
