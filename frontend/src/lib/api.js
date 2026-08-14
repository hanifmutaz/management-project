const BASE = '/api';
async function req(path, options = {}) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  if (res.status === 204) return null;
  return res.json();
}
export const api = {
  dashboard: () => req('/dashboard'),
  analytics: () => req('/dashboard/analytics'),
  projects: (qs = '') => req('/projects' + qs),
  project: (id) => req(`/projects/${id}`),
  createProject: (d) => req('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id, d) => req(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  pinProject: (id) => req(`/projects/${id}/pin`, { method: 'PATCH' }),
  deleteProject: (id) => req(`/projects/${id}`, { method: 'DELETE' }),
  tasks: (qs = '') => req('/tasks' + qs),
  createTask: (d) => req('/tasks', { method: 'POST', body: JSON.stringify(d) }),
  updateTask: (id, d) => req(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  setTaskStatus: (id, status) => req(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),
  worklogs: (qs = '') => req('/worklogs' + qs),
  createLog: (d) => req('/worklogs', { method: 'POST', body: JSON.stringify(d) }),
  updateLog: (id, d) => req(`/worklogs/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteLog: (id) => req(`/worklogs/${id}`, { method: 'DELETE' }),
  payments: (qs = '') => req('/payments' + qs),
  createPayment: (d) => req('/payments', { method: 'POST', body: JSON.stringify(d) }),
  updatePayment: (id, d) => req(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  markPaid: (id) => req(`/payments/${id}/paid`, { method: 'PATCH' }),
  deletePayment: (id) => req(`/payments/${id}`, { method: 'DELETE' }),
};
