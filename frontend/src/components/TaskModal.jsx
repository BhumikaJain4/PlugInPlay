import { useState, useEffect } from 'react'
import { Modal, FormField, Input, Textarea, Select, Button } from './ui'
import { useCreateTask, useUpdateTask } from '../hooks/useApi'
import { LINK_LABELS } from '../utils/helpers'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DEFAULT_FORM = {
  title: '', detail: '', assigned_to: '', due_date: '',
  module: 'SM Orientation', links: []
}

const TEAM_NAMES = [
  'Jahnvi Nagdev','Sanskriti Patidar','Rushal Panchal (SEDC)',
  'Annanya Deshmukh (SEDC)','Vinchy Makwana','Fenil Shah','Full Team'
]

export default function TaskModal({ open, onClose, editTask = null }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || '',
        detail: editTask.detail?.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim() || '',
        assigned_to: editTask.assigned_to || '',
        due_date: editTask.due_date || '',
        module: editTask.module || 'SM Orientation',
        links: editTask.links || [],
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [editTask, open])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addLink = () => set('links', [...form.links, { title: '', url: '', type: 'doc' }])
  const removeLink = (i) => set('links', form.links.filter((_, idx) => idx !== i))
  const updateLink = (i, key, val) => set('links', form.links.map((l, idx) => idx === i ? { ...l, [key]: val } : l))

  const parseDateString = (dateStr) => {
    // e.g. "2026-03-19" from <input type="date">
    const d = new Date(dateStr)
    return {
      due_day: d.getDate(),
      due_month: d.getMonth() + 1,
      due_year: d.getFullYear(),
      due_date: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.due_date) return

    const dateInfo = parseDateString(form.due_date)
    const detailHtml = '<ul>' + form.detail.split('\n').filter(l => l.trim())
      .map(l => `<li>${l.replace(/^[-•]\s*/, '')}</li>`).join('') + '</ul>'

    const payload = {
      title: form.title,
      detail: detailHtml,
      assigned_to: form.assigned_to || TEAM_NAMES[0],
      module: form.module,
      links: form.links.filter(l => l.url),
      ...dateInfo,
    }

    if (editTask) {
      await updateTask.mutateAsync({ id: editTask.id, data: payload })
    } else {
      await createTask.mutateAsync(payload)
    }
    onClose()
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Modal open={open} onClose={onClose} title={editTask ? 'Edit Task' : 'Create New Task'}>
      <form onSubmit={handleSubmit}>
        <FormField label="Task Title" required>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter task title..." required />
        </FormField>

        <FormField label="Description / Steps">
          <Textarea value={form.detail} onChange={e => set('detail', e.target.value)} placeholder={`- Step 1\n- Step 2\n- Step 3`} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Due Date" required>
            <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} required />
          </FormField>
          <FormField label="Assigned To">
            <Select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              {TEAM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </Select>
          </FormField>
        </div>

        <FormField label="Module">
          <Select value={form.module} onChange={e => set('module', e.target.value)}>
            {['SM Orientation','Communications','Infrastructure'].map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormField>

        {/* Reference Links */}
        <div className="border-t border-taupe-light my-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm text-charcoal flex items-center gap-2">
              <i className="fas fa-paperclip text-gold" /> Reference Links
            </span>
            <button type="button" onClick={addLink}
              className="text-xs font-semibold px-3 py-1.5 bg-cream border border-taupe rounded-lg text-maroon hover:border-maroon transition-colors cursor-pointer">
              <i className="fas fa-plus mr-1" /> Add Link
            </button>
          </div>
          {form.links.map((link, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_36px] gap-2 mb-2.5 items-center">
              <input type="url" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)}
                placeholder="https://..." className="px-3 py-2.5 bg-cream border-2 border-taupe-light rounded-xl text-sm focus:outline-none focus:border-gold focus:bg-white transition-all" />
              <select value={link.type} onChange={e => updateLink(i, 'type', e.target.value)}
                className="px-3 py-2.5 bg-cream border-2 border-taupe-light rounded-xl text-sm focus:outline-none focus:border-gold focus:bg-white transition-all">
                {Object.entries(LINK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button type="button" onClick={() => removeLink(i)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-taupe bg-cream text-taupe hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-end mt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            <i className="fas fa-plus" />
            {isPending ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
