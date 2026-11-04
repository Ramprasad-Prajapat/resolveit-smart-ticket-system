import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../api';

describe('API Client (api.js)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('attaches Bearer token from localStorage to headers', async () => {
    localStorage.setItem('token', 'my-secret-jwt-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ id: 1, fullName: 'John Doe' }),
    });

    const res = await api.getMe();
    expect(res).toEqual({ id: 1, fullName: 'John Doe' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-secret-jwt-token',
        }),
      })
    );
  });

  it('handles 401 on protected endpoint by clearing localStorage and throwing error', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(api.getComplaints()).rejects.toThrow('Session expired. Please log in again.');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('handles network failure with friendly Cannot reach the server error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network disconnected'));

    await expect(api.login('test@example.com', 'Pass123')).rejects.toThrow('Cannot reach the server.');
  });

  it('parses structured validation errors on 400 Bad Request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({
        message: 'Validation failed',
        errors: { title: 'Title must be 3 to 100 characters' },
      }),
    });

    try {
      await api.createComplaint({ title: 'ab' });
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.message).toBe('Validation failed');
      expect(err.errors).toEqual({ title: 'Title must be 3 to 100 characters' });
    }
  });

  it('calls wrapper functions with correct HTTP methods and query parameters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    });

    // getComplaints with query params
    await api.getComplaints({ page: 1, size: 20, status: 'OPEN' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/complaints?page=1&size=20&status=OPEN'),
      expect.objectContaining({ method: 'GET' })
    );

    // updateComplaintStatus
    await api.updateComplaintStatus(12, 'RESOLVED', 'Issue fixed');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/complaints/12/status'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED', note: 'Issue fixed' }),
      })
    );

    // assignComplaint
    await api.assignComplaint(12, 5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/complaints/12/assign'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ assigneeId: 5 }),
      })
    );

    // deleteComplaint
    await api.deleteComplaint(12);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/complaints/12'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
