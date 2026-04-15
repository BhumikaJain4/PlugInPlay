import { useState } from 'react'
import { useTeam, useTasks, useCreateMember, useUpdateMember, useDeleteMember } from '../hooks/useApi'
import { StatBox, Modal, FormField, Input, Select, Spinner, EmptyState } from '../components/ui'
import { AVATAR_COLORS, getInitials } from '../utils/helpers'

const COLORS = ['maroon','gold','green','blue','purple','pink']
const COLOR_DOT = { maroon:'bg-maroon', gold:'bg-gold', green:'bg-emerald-600', blue:'bg-blue-500', purple:'bg-purple-500', pink:'bg-rose-500' }
const DEFAULT_FORM = { name:'', dept:'', role:'', email:'', avatar_color:'maroon' }

export default function TeamPage() {
  const { data: team = [], isLoading } = useTeam()
  const { data: tasks = [] } = useTasks()
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()
  const deleteMember = useDeleteMember()

  const [viewMode, setViewMode] = useState('cards')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const getMemberTasks = (name) =>
    tasks.filter(t => t.assigned_to?.toLowerCase().includes(name.split(' ')[0].toLowerCase()))

  // Stats
  const totalCompleted = tasks.filter(t => t.status === 'completed').length
  const depts = new Set(team.map(m => m.dept)).size

  const openCreate = () => { setEditId(null); setForm(DEFAULT_FORM); setModalOpen(true) }
  const openEdit   = (m) => { setEditId(m.id); setForm({ name:m.name, dept:m.dept, role:m.role, email:m.email||'', avatar_color:m.avatar_color }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editId) {
      await updateMember.mutateAsync({ id: editId, data: form })
    } else {
      await createMember.mutateAsync(form)
    }
    setModalOpen(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from the team?`)) return
    await deleteMember.mutateAsync(id)
  }

  const maxTasks = Math.max(1, ...team.map(m => getMemberTasks(m.name).length))
  const barColors = ['#6a0f21','#b98b33','#059669','#3b82f6','#8b5cf6','#e11d48']

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">Team Management</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Manage members, track workload & view task assignments</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
          <i className="fas fa-user-plus" /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <StatBox icon="fa-users"          value={team.length}     label="Team Members" />
        <StatBox icon="fa-building"       value={depts}           label="Departments"  iconStyle={{ background:'rgba(185,139,51,.2)', color:'#b98b33' }} />
        <StatBox icon="fa-check-circle"   value={totalCompleted}  label="Tasks Completed" iconStyle={{ background:'rgba(5,150,105,.2)', color:'#059669' }} />
        <StatBox icon="fa-clipboard-list" value={tasks.length - totalCompleted} label="Tasks Pending" iconStyle={{ background:'rgba(106,15,33,.2)', color:'#6a0f21' }} />
      </div>

      {/* View toggle */}
      <div className="mb-8 flex w-full gap-2 rounded-xl bg-cream p-2 sm:w-fit">
        {[['cards','fa-th-large','Cards'],['workload','fa-chart-bar','Workload']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setViewMode(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-4 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-5
              ${viewMode === key ? 'bg-maroon text-cream' : 'bg-transparent text-charcoal-light hover:bg-cream-dark'}`}>
            <i className={`fas ${icon}`} /> {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 min-[900px]:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
              {team.map(member => {
                const mt = getMemberTasks(member.name)
                const pending = mt.filter(t => t.status !== 'completed')
                const done    = mt.filter(t => t.status === 'completed')
                const bg = AVATAR_COLORS[member.avatar_color] || AVATAR_COLORS.maroon
                return (
                  <div key={member.id} className="relative rounded-2xl border-2 border-taupe-light bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-maroon/10 sm:p-7">
                    {/* Card header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg border-[3px] border-gold shrink-0"
                        style={{ background: bg }}>{getInitials(member.name)}</div>
                      <div>
                        <h3 className="font-serif text-lg text-charcoal">{member.name}</h3>
                        <p className="text-xs text-charcoal-light flex items-center gap-1.5 mt-0.5"><i className="fas fa-building text-gold text-[0.6rem]" />{member.dept}</p>
                        <p className="text-xs text-charcoal-light flex items-center gap-1.5 mt-0.5"><i className="fas fa-tag text-gold text-[0.6rem]" />{member.role}</p>
                        {member.email && <p className="text-xs text-charcoal-light flex items-center gap-1.5 mt-0.5"><i className="fas fa-envelope text-gold text-[0.6rem]" />{member.email}</p>}
                      </div>
                    </div>

                    <span className="absolute right-4 top-4 rounded-full border border-taupe bg-cream-dark px-3 py-1.5 text-xs font-bold text-maroon sm:right-5 sm:top-5">
                      {mt.length} task{mt.length !== 1 ? 's' : ''}
                    </span>

                    {/* Mini stats */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-cream rounded-xl p-3 text-center">
                        <div className="font-serif text-2xl font-bold text-maroon">{pending.length}</div>
                        <div className="text-[0.7rem] text-charcoal-light mt-0.5">Pending</div>
                      </div>
                      <div className="bg-cream rounded-xl p-3 text-center">
                        <div className="font-serif text-2xl font-bold text-emerald-600">{done.length}</div>
                        <div className="text-[0.7rem] text-charcoal-light mt-0.5">Done</div>
                      </div>
                    </div>

                    {/* Task preview */}
                    {pending.length > 0 ? (
                      <div className="flex flex-col gap-1.5 mb-5">
                        {pending.slice(0,3).map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-charcoal bg-cream px-2.5 py-1.5 rounded-lg border border-taupe-light">
                            <i className="fas fa-circle text-gold text-[0.5rem] shrink-0" />
                            <span className="flex-1 truncate">{t.title}</span>
                            <span className="text-taupe shrink-0">{t.due_date}</span>
                          </div>
                        ))}
                        {pending.length > 3 && (
                          <p className="text-xs text-charcoal-light px-1">+{pending.length - 3} more</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-600 py-2 text-center mb-5">
                        <i className="fas fa-check-circle mr-1" /> All tasks completed!
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                      <button onClick={() => openEdit(member)}
                        className="flex min-w-[120px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-taupe bg-cream py-2.5 text-sm font-semibold text-charcoal-light transition-all hover:border-maroon hover:bg-white hover:text-maroon">
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button onClick={() => handleDelete(member.id, member.name)}
                        className="flex min-w-[120px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-taupe bg-cream py-2.5 text-sm font-semibold text-charcoal-light transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-500">
                        <i className="fas fa-trash-alt" /> Remove
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Add card */}
              <button onClick={openCreate}
                className="bg-white rounded-2xl border-2 border-dashed border-taupe min-h-[200px] flex flex-col items-center justify-center gap-3 text-taupe hover:border-maroon hover:text-maroon transition-all cursor-pointer p-7">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center text-2xl">+</div>
                <span className="font-semibold text-sm">Add Member</span>
              </button>
            </div>
          )}

          {/* Workload View */}
          {viewMode === 'workload' && (
            <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
              <h2 className="font-serif text-2xl text-maroon mb-6">Task Workload by Member</h2>
              {team.length === 0 ? <EmptyState /> : (
                <div className="flex flex-col gap-4">
                  {team.map((member, i) => {
                    const mt = getMemberTasks(member.name)
                    const pending = mt.filter(t => t.status !== 'completed').length
                    const done    = mt.filter(t => t.status === 'completed').length
                    const pct     = Math.round((mt.length / maxTasks) * 100)
                    const bg      = AVATAR_COLORS[member.avatar_color] || AVATAR_COLORS.maroon
                    return (
                      <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-taupe-light bg-cream p-4 lg:flex-row lg:items-center lg:gap-5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm border-2 border-gold shrink-0"
                          style={{ background: bg }}>{getInitials(member.name)}</div>
                        <div className="min-w-0 lg:min-w-[180px]">
                          <div className="font-semibold text-sm text-charcoal">{member.name}</div>
                          <div className="text-xs text-charcoal-light">{member.role}</div>
                        </div>
                        <div className="flex-1 bg-white rounded-full h-2.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: barColors[i % barColors.length] }} />
                        </div>
                        <div className="font-bold text-sm text-maroon lg:min-w-[60px] lg:text-right">
                          {mt.length} task{mt.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs lg:min-w-[130px] lg:justify-end">
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">{pending} pending</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">{done} done</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Member Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Member' : 'Add Team Member'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required className="col-span-2">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" />
          </FormField>
          <FormField label="Department">
            <Input value={form.dept} onChange={e => set('dept', e.target.value)} placeholder="e.g. CSE" />
          </FormField>
          <FormField label="Role">
            <Input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Coordinator" />
          </FormField>
          <FormField label="Email" className="col-span-2">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. priya@example.com" />
          </FormField>
          <FormField label="Avatar Color" className="col-span-2">
            <div className="flex gap-3 mt-1">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('avatar_color', c)}
                  className={`w-9 h-9 rounded-full ${COLOR_DOT[c]} transition-all cursor-pointer
                    ${form.avatar_color === c ? 'ring-4 ring-offset-2 ring-gold scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`} />
              ))}
            </div>
          </FormField>
        </div>
        <div className="flex gap-4 justify-end mt-6">
          <button onClick={() => setModalOpen(false)}
            className="px-5 py-3 bg-white text-maroon border-2 border-taupe rounded-xl font-semibold text-sm hover:border-maroon transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={createMember.isPending || updateMember.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 bg-maroon text-cream rounded-xl font-semibold text-sm hover:bg-maroon-dark transition-all cursor-pointer disabled:opacity-50">
            <i className="fas fa-user-plus" />
            {createMember.isPending || updateMember.isPending ? 'Saving...' : editId ? 'Update' : 'Add Member'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
