// API client — semua akses data lewat sini ke backend Express + PostgreSQL.
// Token JWT disimpan di localStorage (hanya token, BUKAN data).
const BASE = '/api';

export function getToken() { return localStorage.getItem('ph_token'); }
export function setAuth(token, user) {
  localStorage.setItem('ph_token', token);
  localStorage.setItem('ph_user', JSON.stringify(user));
}
export function getUser() { try { return JSON.parse(localStorage.getItem('ph_user')); } catch { return null; } }
export function logout() { localStorage.removeItem('ph_token'); localStorage.removeItem('ph_user'); }

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { logout(); window.location.reload(); throw new Error('Sesi habis, silakan login lagi'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  login: (email, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  users: () => req('/auth/users'),

  // dashboard & projects
  dashboard: () => req('/dashboard'),
  projects: () => req('/projects'),
  project: (id) => req(`/projects/${id}`),
  nextCode: () => req('/projects/meta/next-code'),
  createProject: (d) => req('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id, d) => req(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id) => req(`/projects/${id}`, { method: 'DELETE' }),

  // generic entity CRUD: kind = tasks|milestones|deliverables|issues|risks|actions|decisions
  create: (kind, d) => req(`/${kind}`, { method: 'POST', body: JSON.stringify(d) }),
  update: (kind, id, d) => req(`/${kind}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (kind, id) => req(`/${kind}/${id}`, { method: 'DELETE' }),

  // evidence
  evidence: (params = '') => req(`/evidence${params}`),

  // approvals
  approvals: (status) => req(`/approvals${status ? '?status=' + status : ''}`),
  requestApproval: (d) => req('/approvals', { method: 'POST', body: JSON.stringify(d) }),
  decideApproval: (id, decision, note) => req(`/approvals/${id}/decide`, { method: 'PATCH', body: JSON.stringify({ decision, note }) }),

  // notifications
  notifications: () => req('/notifications'),
  readNotif: (id) => req(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotif: () => req('/notifications/read-all', { method: 'PATCH' }),
};
