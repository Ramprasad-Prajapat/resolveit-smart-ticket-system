/**
 * Single API client using browser fetch for all backend communication.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export async function request(method, path, body = null) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    const error = new Error('Cannot reach the server.');
    error.status = 0;
    throw error;
  }

  // Handle 401 Unauthorized for authenticated endpoints
  if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    const error = new Error('Session expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    if (data && data.errors) {
      error.errors = data.errors;
    }
    throw error;
  }

  return data;
}

// Authentication
export const login = (email, password) => request('POST', '/auth/login', { email, password });
export const register = (fullName, email, password) => request('POST', '/auth/register', { fullName, email, password });
export const getMe = () => request('GET', '/auth/me');
export const updateProfile = (fullName) => request('PUT', '/auth/me', { fullName });
export const changePassword = (currentPassword, newPassword) =>
  request('PUT', '/auth/password', { currentPassword, newPassword });

// Complaints
export const getComplaints = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return request('GET', `/complaints${queryString ? `?${queryString}` : ''}`);
};

export const getComplaintSummary = () => request('GET', '/complaints/summary');
export const getComplaint = (id) => request('GET', `/complaints/${id}`);
export const createComplaint = (data) => request('POST', '/complaints', data);
export const updateComplaint = (id, data) => request('PUT', `/complaints/${id}`, data);
export const updateComplaintStatus = (id, status, note = '') =>
  request('PATCH', `/complaints/${id}/status`, { status, note });
export const assignComplaint = (id, assigneeId) =>
  request('PATCH', `/complaints/${id}/assign`, { assigneeId });
export const deleteComplaint = (id) => request('DELETE', `/complaints/${id}`);

// Comments & History
export const getComments = (id) => request('GET', `/complaints/${id}/comments`);
export const addComment = (id, message) => request('POST', `/complaints/${id}/comments`, { message });
export const getHistory = (id) => request('GET', `/complaints/${id}/history`);

// Notifications
export const getUnreadNotifications = () => request('GET', '/notifications/unread');
export const markNotificationRead = (id) => request('PATCH', `/notifications/${id}/read`);


// Admin
export const getAdminUsers = () => request('GET', '/admin/users');
export const getAssignableUsers = () => request('GET', '/admin/users/assignable');
export const updateUserRole = (id, role) => request('PATCH', `/admin/users/${id}/role`, { role });
export const updateUserActive = (id, active) => request('PATCH', `/admin/users/${id}/active`, { active });
