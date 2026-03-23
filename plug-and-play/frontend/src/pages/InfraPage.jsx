import { useState } from 'react'
import { useInfra, useCreateInfra, useToggleInfra, useDeleteInfra } from '../hooks/useApi'
import { StatBox, Modal, FormField, Input, Select, Spinner, EmptyState } from '../components/ui'
import { INFRA_CATEGORIES } from '../utils/helpers'

const DEFAULT_FORM = { name:'', category:'venue', owner:'Sanskriti Patidar', notes:'' }
const OWNERS = ['Sanskriti Patidar','Rushal Panchal','Jahnvi Nagdev','Annanya Deshmukh','Vinchy Makwana','Fenil Shah']

export default function InfraPage() {
  const { data: items = [], isLoading } = useInfra()
  const createInfra = useCreateInfra()
  const toggleInfra = useToggleInfra()
  const deleteInfra = useDeleteInfra()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const done    = items.filter(i => i.done).length
  const pending = items.length - done
  const pct     = items.length ? Math.round((done / items.length) * 100) : 0

  const handleSave = async () => {
    if (!form.name.trim()) return
    await createInfra.mutateAsync(form)
    setModalOpen(false)
    setForm(DEFAULT_FORM)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">Infrastructure</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Venues, materials, access &amp; readiness checklist</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
          <i className="fas fa-plus" /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <StatBox icon="fa-list"           value={items.length} label="Total Items" />
        <StatBox icon="fa-check-circle"   value={done}         label="Done"        iconStyle={{ background:'rgba(5,150,105,.2)', color:'#059669' }} />
        <StatBox icon="fa-hourglass-half" value={pending}      label="Pending"     iconStyle={{ background:'rgba(217,119,6,.15)', color:'#d97706' }} />
        <StatBox icon="fa-percentage"     value={`${pct}%`}    label="Readiness"   iconStyle={{ background:'rgba(185,139,51,.2)', color:'#b98b33' }} />
      </div>

      {/* Readiness progress bar */}
      <div className="mb-8 rounded-2xl border border-taupe-light bg-white p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-charcoal text-sm">Overall Readiness</span>
          <span className="font-bold text-maroon">{pct}%</span>
        </div>
        <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-maroon to-gold-light rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {Object.entries(INFRA_CATEGORIES).map(([cat, meta]) => {
            const catItems = items.filter(i => i.category === cat)
            const catDone  = catItems.filter(i => i.done).length
            return (
              <div key={cat} className="bg-white rounded-2xl border border-taupe-light overflow-hidden">
                <div className="flex items-center gap-3 border-b border-taupe-light bg-cream px-4 py-4 sm:px-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: meta.color, color: meta.iconColor }}>
                    <i className={`fas ${meta.icon}`} />
                  </div>
                  <span className="font-serif text-base text-maroon font-semibold flex-1">{meta.label}</span>
                  <span className="text-xs font-bold text-charcoal-light">{catDone}/{catItems.length}</span>
                </div>

                <div className="min-h-[80px] p-3.5 sm:p-4 flex flex-col gap-2">
                  {catItems.length === 0 ? (
                    <div className="text-center py-6 text-taupe text-sm">No items yet</div>
                  ) : catItems.map(item => (
                    <div key={item.id}
                      onClick={() => toggleInfra.mutate({ id: item.id, done: !item.done })}
                      className={`flex items-start sm:items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all
                        ${item.done ? 'bg-emerald-50/60 border-emerald-200' : 'bg-cream border-taupe-light hover:border-gold'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all text-[0.65rem]
                        ${item.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-taupe'}`}>
                        {item.done && <i className="fas fa-check" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm ${item.done ? 'line-through text-charcoal-light opacity-60' : 'text-charcoal'}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-charcoal-light flex items-center gap-1.5 mt-0.5">
                          <i className="fas fa-user text-gold text-[0.6rem]" />{item.owner}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteInfra.mutate(item.id) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-taupe hover:bg-red-100 hover:text-red-500 transition-all cursor-pointer border-0 bg-transparent text-xs">
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Infrastructure Item">
        <FormField label="Item / Requirement" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Projector for MPH" />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category">
            <Select value={form.category} onChange={e => set('category', e.target.value)}>
              {Object.entries(INFRA_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Owner">
            <Select value={form.owner} onChange={e => set('owner', e.target.value)}>
              {OWNERS.map(o => <option key={o}>{o}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label="Notes">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional details..." />
        </FormField>
        <div className="flex gap-4 justify-end mt-6">
          <button onClick={() => setModalOpen(false)}
            className="px-5 py-3 bg-white text-maroon border-2 border-taupe rounded-xl font-semibold text-sm hover:border-maroon transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={createInfra.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 bg-maroon text-cream rounded-xl font-semibold text-sm hover:bg-maroon-dark transition-all cursor-pointer disabled:opacity-50">
            <i className="fas fa-plus" />{createInfra.isPending ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
