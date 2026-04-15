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
  resetAll: () => api.delete('/tasks/reset-all').then(r => r.data),
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
  send: (id) => api.post(`/communications/${id}/send`).then(r => r.data),
  testSend: (data) => api.post('/communications/test-send', data).then(r => r.data),
  smtpCheck: () => api.get('/communications/smtp-check').then(r => r.data),
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

// ── Participants ──────────────────────────────────────────────────────────────
export const participantsApi = {
  getAll: (params) => api.get('/participants', { params }).then(r => r.data),
  create: (data) => api.post('/participants', data).then(r => r.data),
  bulkCreate: (participants) => api.post('/participants/bulk', { participants }).then(r => r.data),
  importFromSheet: (url) => api.post('/participants/import-from-sheet', { url }).then(r => r.data),
  resetAll: () => api.delete('/participants/reset-all').then(r => r.data),
  autoAssign: (quotas) => api.post('/participants/auto-assign', { quotas }).then(r => r.data),
  screening: (id, data) => api.patch(`/participants/${id}/screening`, data).then(r => r.data),
  interview: (id, data) => api.patch(`/participants/${id}/interview`, data).then(r => r.data),
  selection: (id, selected) => api.patch(`/participants/${id}/selection`, { selected }).then(r => r.data),
  finalMail: (data) => api.post('/participants/final-mail', data).then(r => r.data),
  getQuestions: () => api.get('/participants/questions').then(r => r.data),
  updateQuestions: (questions) => api.put('/participants/questions', { questions }).then(r => r.data),
}
