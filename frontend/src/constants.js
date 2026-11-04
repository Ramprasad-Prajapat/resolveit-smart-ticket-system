/**
 * Constants and label helpers for ResolveIT application.
 */

export const ROLES = {
  USER: 'USER',
  AGENT: 'AGENT',
  ADMIN: 'ADMIN',
};

export const COMPLAINT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
};

export const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const COMPLAINT_CATEGORY = {
  TECHNICAL: 'TECHNICAL',
  NETWORK: 'NETWORK',
  ACCOUNT: 'ACCOUNT',
  HARDWARE: 'HARDWARE',
  OTHER: 'OTHER',
};

export const CATEGORY_LABELS = {
  TECHNICAL: 'Technical',
  NETWORK: 'Network',
  ACCOUNT: 'Account',
  HARDWARE: 'Hardware',
  OTHER: 'Other',
};

export const COMPLAINT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'updatedAt,desc', label: 'Recently updated' },
  { value: 'title,asc', label: 'Title (A–Z)' },
];

export const POLL_SECONDS = Number(import.meta.env.VITE_POLL_SECONDS) || 5;
export const ALERT_SECONDS = Number(import.meta.env.VITE_ALERT_SECONDS) || 30;

