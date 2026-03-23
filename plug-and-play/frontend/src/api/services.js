import api from './client'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (email, password) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  updateMe: (data) => api.patch('/auth/me', data).then(r => r.data),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(r => r.data),
  getOne: (id) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`),
  markComplete: (id) => api.patch(`/tasks/${id}`, { status: 'completed' }).then(r => r.data),
}

// ── Team ──────────────────────────────────────────────────────────────────────
export const teamApi = {
  getAll: () => api.get('/team').then(r => r.data),
  create: (data) => api.post('/team', data).then(r => r.data),
  update: (id, data) => api.patch(`/team/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/team/${id}`),
}

// ── Communications ────────────────────────────────────────────────────────────
export const commsApi = {
  getAll: (params) => api.get('/communications', { params }).then(r => r.data),
  create: (data) => api.post('/communications', data).then(r => r.data),
  update: (id, data) => api.patch(`/communications/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/communications/${id}`),
}

// ── Infrastructure ────────────────────────────────────────────────────────────
export const infraApi = {
  getAll: (params) => api.get('/infrastructure', { params }).then(r => r.data),
  create: (data) => api.post('/infrastructure', data).then(r => r.data),
  update: (id, data) => api.patch(`/infrastructure/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/infrastructure/${id}`),
  toggle: (id, done) => api.patch(`/infrastructure/${id}`, { done }).then(r => r.data),
}

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: (params) => api.get('/logs', { params }).then(r => r.data),
}

// ── Users (Admin) ────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then(r => r.data),
  delete: (id) => api.delete(`/users/${id}`).then(r => r.data),
}

// ── Applications ─────────────────────────────────────────────────────────────
export const applicationsApi = {
  getSheet: () => api.get('/applications').then(r => r.data),
  saveSheet: (url) => api.put('/applications', { url }).then(r => r.data),
}
