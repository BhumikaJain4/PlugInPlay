import { useState } from 'react'
import { useComms, useCreateComm, useUpdateComm, useDeleteComm } from '../hooks/useApi'
import { StatBox, Modal, FormField, Input, Select, Spinner, EmptyState } from '../components/ui'
import { COMM_STATUS } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

const DEFAULT_FORM = { title:'', assigned_to:'Rushal Panchal', status:'draft', doc_link:'' }
const TEAM = ['Rushal Panchal','Jahnvi Nagdev','Sanskriti Patidar','Annanya Deshmukh']

export default function CommsPage() {
  const { user } = useAuth()
  const { data: comms = [], isLoading } = useComms()
  const createComm = useCreateComm()
  const updateComm = useUpdateComm()
  const deleteComm = useDeleteComm()

  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const isAdmin = user?.role === 'admin'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const displayed = filterStatus === 'all' ? comms : comms.filter(c => c.status === filterStatus)

  const stats = {
    total:    comms.length,
    draft:    comms.filter(c => c.status === 'draft').length,
    approved: comms.filter(c => c.status === 'approved').length,
    sent:     comms.filter(c => c.status === 'sent').length,
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    await createComm.mutateAsync(form)
    setModalOpen(false)
    setForm(DEFAULT_FORM)
  }

  const handleStatusUpdate = async (id, status) => {
    await updateComm.mutateAsync({ id, data: { status } })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this email draft?')) return
    await deleteComm.mutateAsync(id)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">Communications</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Email drafts, send status &amp; messaging checklist</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
          <i className="fas fa-plus" /> New Draft
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <StatBox icon="fa-envelope"      value={stats.total}    label="Total Emails" />
        <StatBox icon="fa-edit"          value={stats.draft}    label="In Draft"    iconStyle={{ background:'rgba(217,119,6,.15)', color:'#d97706' }} />
        <StatBox icon="fa-check-double"  value={stats.approved} label="Approved"    iconStyle={{ background:'rgba(59,130,246,.15)', color:'#3b82f6' }} />
        <StatBox icon="fa-paper-plane"   value={stats.sent}     label="Sent"        iconStyle={{ background:'rgba(5,150,105,.2)', color:'#059669' }} />
      </div>

      {/* Email list */}
      <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl text-maroon">Email Drafts &amp; Status</h2>
          <div className="flex w-full flex-wrap gap-1.5 rounded-xl bg-cream p-1.5 sm:w-auto sm:flex-nowrap">
            {['all','draft','approved','sent'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`flex-1 rounded-lg border-0 px-4 py-2 text-sm font-medium capitalize transition-all sm:flex-none
                  ${filterStatus === s ? 'bg-maroon text-cream' : 'bg-transparent text-charcoal-light hover:bg-cream-dark'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : displayed.length === 0 ? <EmptyState icon="fa-envelope" message="No emails found" />
          : (
            <div className="flex flex-col gap-4">
              {displayed.map(comm => {
                const s = COMM_STATUS[comm.status]
                return (
                  <div key={comm.id}
                    className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-taupe-light bg-white p-4 transition-all hover:border-gold hover:shadow-lg hover:shadow-maroon/6 sm:items-center sm:gap-5 sm:p-5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <div className="font-bold text-base text-charcoal mb-1">{comm.title}</div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal-light sm:gap-4">
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-user text-gold text-xs" />{comm.assigned_to}
                        </span>
                        {comm.doc_link && (
                          <a href={comm.doc_link} target="_blank" rel="noreferrer"
                            className="text-maroon font-semibold hover:underline flex items-center gap-1.5 no-underline">
                            <i className="fas fa-external-link-alt text-xs" /> Open Doc
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold px-3.5 py-1.5 rounded-full border-2 shrink-0"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                      {s.label}
                    </span>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                      {isAdmin && comm.status !== 'approved' && (
                        <button onClick={() => handleStatusUpdate(comm.id, 'approved')} title="Mark Approved"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-taupe bg-cream text-sm text-charcoal-light transition-all hover:border-maroon hover:bg-maroon hover:text-white">
                          <i className="fas fa-check" />
                        </button>
                      )}
                      {isAdmin && comm.status !== 'sent' && (
                        <button onClick={() => handleStatusUpdate(comm.id, 'sent')} title="Mark Sent"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-taupe bg-cream text-sm text-charcoal-light transition-all hover:border-maroon hover:bg-maroon hover:text-white">
                          <i className="fas fa-paper-plane" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(comm.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-taupe bg-cream text-sm text-charcoal-light transition-all hover:border-red-500 hover:bg-red-500 hover:text-white">
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Add modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Email Draft">
        <FormField label="Email Title / Purpose" required>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Call for Interview Email" />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Assigned To">
            <Select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              {TEAM.map(n => <option key={n}>{n}</option>)}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Draft</option>
              {isAdmin && <option value="approved">Approved</option>}
              {isAdmin && <option value="sent">Sent</option>}
            </Select>
          </FormField>
        </div>
        <FormField label="Doc Link (optional)">
          <Input type="url" value={form.doc_link} onChange={e => set('doc_link', e.target.value)} placeholder="https://docs.google.com/..." />
        </FormField>
        <div className="flex gap-4 justify-end mt-6">
          <button onClick={() => setModalOpen(false)}
            className="px-5 py-3 bg-white text-maroon border-2 border-taupe rounded-xl font-semibold text-sm hover:border-maroon transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={createComm.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 bg-maroon text-cream rounded-xl font-semibold text-sm hover:bg-maroon-dark transition-all cursor-pointer disabled:opacity-50">
            <i className="fas fa-save" />{createComm.isPending ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
