import { clsx } from 'clsx'

export const cn = (...args) => clsx(...args)

export const AVATAR_COLORS = {
  maroon: 'linear-gradient(135deg, #6a0f21, #8c1f35)',
  gold:   'linear-gradient(135deg, #b98b33, #d4a84b)',
  green:  'linear-gradient(135deg, #059669, #10b981)',
  blue:   'linear-gradient(135deg, #3b82f6, #60a5fa)',
  purple: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  pink:   'linear-gradient(135deg, #e11d48, #fb7185)',
}

export const LINK_ICONS = {
  canva: 'fa-palette',
  ppt:   'fa-file-powerpoint',
  form:  'fa-wpforms',
  email: 'fa-envelope',
  doc:   'fa-file-alt',
  drive: 'fa-google-drive',
}

export const LINK_LABELS = {
  doc:   'Google Doc',
  form:  'Google Form',
  canva: 'Canva',
  ppt:   'PPT / Slides',
  email: 'Email / Newsletter',
  drive: 'Google Drive',
}

export const COMM_STATUS = {
  draft:    { color: '#d97706', bg: 'rgba(217,119,6,.1)',    border: 'rgba(217,119,6,.3)',    label: 'Draft' },
  approved: { color: '#3b82f6', bg: 'rgba(59,130,246,.1)',   border: 'rgba(59,130,246,.3)',   label: 'Approved' },
  sent:     { color: '#059669', bg: 'rgba(5,150,105,.1)',    border: 'rgba(5,150,105,.25)',   label: 'Sent' },
}

export const INFRA_CATEGORIES = {
  venue:     { label: 'Venue',          icon: 'fa-map-marker-alt', color: 'rgba(106,15,33,.15)',  iconColor: '#6a0f21' },
  materials: { label: 'Materials',      icon: 'fa-box-open',       color: 'rgba(185,139,51,.15)', iconColor: '#b98b33' },
  digital:   { label: 'Digital/Access', icon: 'fa-laptop',         color: 'rgba(59,130,246,.15)', iconColor: '#3b82f6' },
  logistics: { label: 'Logistics',      icon: 'fa-truck',          color: 'rgba(5,150,105,.15)',  iconColor: '#059669' },
}

export function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('')
}

export function getTaskCountsByDay(tasks = []) {
  return tasks.reduce((acc, t) => {
    if (t.status !== 'completed' && t.due_day <= 31 && t.due_month === 3) {
      acc[t.due_day] = (acc[t.due_day] || 0) + 1
    }
    return acc
  }, {})
}

  export function formatDateIST(dateString) {
    let normalized = dateString
    if (typeof normalized === 'string') {
      const hasTz = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized)
      if (!hasTz) normalized = `${normalized}Z`
    }

    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  }
