import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useParticipants, useScreeningDecision, useAutoAssign, useImportParticipantsFromSheet, useResetParticipants, useApplicationsSheet } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Modal, Spinner, EmptyState } from '../components/ui'

const EVALUATORS = ['Kalyani B', 'Ameresh K', 'KM']
const EVALUATOR_SHORT = { 'Kalyani B': 'KB', 'Ameresh K': 'AK', 'KM': 'KM' }

const DECISION_STYLES = {
  yes:   { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700',  icon: 'fa-check',  label: 'Yes' },
  no:    { bg: 'bg-red-50',      border: 'border-red-300',     text: 'text-red-700',      icon: 'fa-times',  label: 'No'  },
  maybe: { bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-700',    icon: 'fa-minus',  label: 'Maybe' },
  '':    { bg: 'bg-cream',       border: 'border-taupe-light', text: 'text-charcoal-light',icon: 'fa-circle', label: 'Pending' },
}

function DecisionBadge({ decision }) {
  const s = DECISION_STYLES[decision] || DECISION_STYLES['']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.border} ${s.text}`}>
      <i className={`fas ${s.icon} text-[10px]`} />
      {s.label}
    </span>
  )
}

function ParticipantCard({ p, onDecide, onOpenProfile }) {
  const [loading, setLoading] = useState(false)

  const decide = async (decision) => {
    setLoading(true)
    await onDecide(p.id, decision)
    setLoading(false)
  }

  const dec = p.screening_decision
  const cardBorder = dec === 'yes' ? 'border-l-4 border-l-emerald-400' :
                     dec === 'no'  ? 'border-l-4 border-l-red-400 opacity-60' :
                     dec === 'maybe' ? 'border-l-4 border-l-amber-400' : ''

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenProfile(p)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenProfile(p)
        }
      }}
      className={`bg-white rounded-2xl border border-taupe-light shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer ${cardBorder}`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal text-sm hover:text-maroon transition-colors text-left line-clamp-1">
              {p.name}
            </p>
            <p className="text-xs text-charcoal-light mt-0.5 truncate">{p.email}</p>
          </div>
          <DecisionBadge decision={p.screening_decision} />
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.program && (
            <span className="px-2 py-0.5 bg-cream-dark rounded-full text-[11px] font-medium text-maroon">{p.program}</span>
          )}
          {p.year && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">Yr {p.year}</span>
          )}
          {p.geography && (
            <span className="px-2 py-0.5 bg-cream rounded-full text-[11px] text-charcoal-light border border-taupe-light">{p.geography}</span>
          )}
          {p.cgpa && (
            <span className="px-2 py-0.5 bg-cream rounded-full text-[11px] text-charcoal-light border border-taupe-light">CGPA {p.cgpa}</span>
          )}
        </div>

        {/* Three words */}
        {p.three_words && (
          <p className="text-[11px] italic text-charcoal-light mb-3 line-clamp-1">"{p.three_words}"</p>
        )}

        {/* Assignee */}
        {p.screening_reviewer && (
          <div className="flex items-center gap-1.5 mb-3">
            <i className="fas fa-user-tie text-[10px] text-taupe" />
            <span className="text-[11px] text-charcoal-light">{p.screening_reviewer}</span>
          </div>
        )}

        {/* Decision buttons */}
        <div className="flex gap-1.5">
          <button
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); decide('yes') }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              dec === 'yes'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <i className="fas fa-check mr-1" />Yes
          </button>
          <button
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); decide('maybe') }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              dec === 'maybe'
                ? 'bg-amber-400 text-white border-amber-400'
                : 'border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <i className="fas fa-minus mr-1" />Maybe
          </button>
          <button
            disabled={loading}
            onClick={(e) => { e.stopPropagation(); decide('no') }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              dec === 'no'
                ? 'bg-red-500 text-white border-red-500'
                : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <i className="fas fa-times mr-1" />No
          </button>
        </div>
      </div>
    </div>
  )
}

function buildInitialQuotas(totalParticipants) {
  const base = Math.floor(totalParticipants / EVALUATORS.length)
  const remainder = totalParticipants % EVALUATORS.length
  return {
    'Kalyani B': base + (remainder > 0 ? 1 : 0),
    'Ameresh K': base + (remainder > 1 ? 1 : 0),
    'KM': base,
  }
}

function AutoAssignModal({ open, onClose, onAssign, loading, totalParticipants }) {
  const [quotas, setQuotas] = useState(() => buildInitialQuotas(totalParticipants || 0))
  const total = Object.values(quotas).reduce((a, b) => a + b, 0)
  const maxAssignable = totalParticipants || 0

  useEffect(() => {
    if (open) {
      setQuotas(buildInitialQuotas(totalParticipants || 0))
    }
  }, [open, totalParticipants])

  return (
    <Modal open={open} onClose={onClose} title="Auto-Assign Participants">
      <p className="text-charcoal-light text-sm mb-6">
        Set how many participants each evaluator should be assigned out of {maxAssignable} total participants.
      </p>
      <div className="space-y-5 mb-6">
        {EVALUATORS.map(ev => (
          <div key={ev}>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-charcoal">{ev}</label>
              <span className="text-sm font-bold text-maroon">{quotas[ev]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxAssignable}
              value={quotas[ev]}
              disabled={maxAssignable === 0}
              onChange={e => setQuotas(q => ({ ...q, [ev]: +e.target.value }))}
              className="w-full accent-maroon"
            />
            <div className="flex justify-between text-[11px] text-charcoal-light mt-0.5">
              <span>0</span><span>{maxAssignable}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between p-3 rounded-xl mb-6 ${total > maxAssignable ? 'bg-red-50 border border-red-200' : 'bg-cream border border-taupe-light'}`}>
        <span className="text-sm font-semibold text-charcoal">Total assigned</span>
        <span className={`text-lg font-bold ${total > maxAssignable ? 'text-red-600' : 'text-maroon'}`}>{total} / {maxAssignable}</span>
      </div>
      {total > maxAssignable && (
        <p className="text-red-600 text-xs mb-4">⚠ Total exceeds {maxAssignable} participants. Extras will be skipped.</p>
      )}
      <button
        onClick={() => onAssign(quotas)}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-maroon text-white font-semibold text-sm transition-all hover:bg-maroon-dark disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-magic'}`} />
        {loading ? 'Assigning...' : 'Assign Now'}
      </button>
    </Modal>
  )
}

function ImportSheetModal({ open, onClose, importUrl, setImportUrl, onImport, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Import From Google Sheet">
      <p className="text-charcoal-light text-sm mb-4">
        Paste a Google Sheets link. The first row must be headers and include at least name and email columns.
      </p>
      <input
        type="url"
        value={importUrl}
        onChange={(e) => setImportUrl(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/..."
        className="w-full px-4 py-3 bg-cream border-2 border-taupe-light rounded-xl text-sm text-charcoal transition-all focus:outline-none focus:border-gold focus:bg-white"
      />
      <div className="mt-5 flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-taupe-light text-charcoal-light text-sm font-semibold hover:bg-cream transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          disabled={loading || !importUrl.trim()}
          className="px-4 py-2.5 rounded-xl bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark transition-all disabled:opacity-60"
        >
          <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-file-import'} mr-2`} />
          {loading ? 'Importing...' : 'Import Now'}
        </button>
      </div>
    </Modal>
  )
}

function ProfileModal({ participant: p, open, onClose, onDecide }) {
  const [loading, setLoading] = useState(false)
  const [remarks, setRemarks] = useState('')

  if (!p) return null

  const copyEmail = async () => {
    await navigator.clipboard.writeText(p.email)
    toast.success('Email copied')
  }

  const decide = async (decision) => {
    setLoading(true)
    await onDecide(p.id, decision, remarks)
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-2xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 flex items-center justify-center text-maroon font-bold text-xl font-serif shrink-0">
          {p.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl text-maroon">{p.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-charcoal-light text-sm">{p.email}</p>
            <button
              onClick={copyEmail}
              className="rounded-full border border-taupe-light px-2 py-1 text-[10px] font-semibold text-maroon transition-all hover:border-maroon hover:bg-maroon hover:text-white"
            >
              Copy email
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DecisionBadge decision={p.screening_decision} />
            {p.screening_reviewer && (
              <span className="text-xs text-charcoal-light">Assigned to {p.screening_reviewer}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          ['Programme', p.program],
          ['Year', p.year ? `Year ${p.year}` : '—'],
          ['CGPA', p.cgpa || '—'],
          ['Geography', p.geography || '—'],
          ['Gender', p.gender || '—'],
          ['Enrollment', p.enrollment || '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-cream rounded-xl p-3">
            <p className="text-[11px] text-charcoal-light font-semibold uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-charcoal">{val}</p>
          </div>
        ))}
      </div>

      {p.three_words && (
        <div className="bg-cream-dark rounded-xl p-4 mb-4">
          <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide mb-1">In Three Words</p>
          <p className="text-sm italic text-charcoal">"{p.three_words}"</p>
        </div>
      )}

      {(p.submission_link_care || p.submission_link_change) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href={p.submission_link_care || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-xl border p-3 text-sm transition-all ${p.submission_link_care ? 'border-taupe hover:border-maroon bg-white text-charcoal' : 'border-taupe-light bg-cream text-charcoal-light pointer-events-none'}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">Link 1 - A Moment of Care and Change</p>
            <p className="line-clamp-2">{p.submission_link_care || 'Not available'}</p>
          </a>
          <a
            href={p.submission_link_change || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-xl border p-3 text-sm transition-all ${p.submission_link_change ? 'border-taupe hover:border-maroon bg-white text-charcoal' : 'border-taupe-light bg-cream text-charcoal-light pointer-events-none'}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">Link 2 - Why Become a Mitr?</p>
            <p className="line-clamp-2">{p.submission_link_change || 'Not available'}</p>
          </a>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">Remarks</label>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          placeholder="Add your screening notes..."
          rows={3}
          className="w-full px-4 py-3 bg-cream border-2 border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => decide('yes')} disabled={loading}
          className="py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i className="fas fa-check" />Yes — Invite
        </button>
        <button onClick={() => decide('maybe')} disabled={loading}
          className="py-3 rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i className="fas fa-minus" />Maybe
        </button>
        <button onClick={() => decide('no')} disabled={loading}
          className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <i className="fas fa-times" />Reject
        </button>
      </div>
    </Modal>
  )
}

export default function ScreeningPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: participants = [], isLoading } = useParticipants()
  const { data: applicationsSheet } = useApplicationsSheet()
  const screeningMutation = useScreeningDecision()
  const autoAssignMutation = useAutoAssign()
  const importFromSheetMutation = useImportParticipantsFromSheet()
  const resetParticipantsMutation = useResetParticipants()

  const [search, setSearch] = useState('')
  const [filterProg, setFilterProg] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [autoAssignOpen, setAutoAssignOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedP, setSelectedP] = useState(null)

  useEffect(() => {
    setImportUrl(applicationsSheet?.url || '')
  }, [applicationsSheet?.url])

  const programmes = useMemo(() =>
    [...new Set(participants.map(p => p.program).filter(Boolean))].sort(),
    [participants]
  )

  const filtered = useMemo(() => {
    let list = participants
    if (search) {
      const t = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(t) ||
        p.email.toLowerCase().includes(t) ||
        (p.geography || '').toLowerCase().includes(t)
      )
    }
    if (filterProg) list = list.filter(p => p.program === filterProg)
    if (filterYear) list = list.filter(p => String(p.year) === filterYear)
    if (filterAssignee === '__unassigned') list = list.filter(p => !p.screening_reviewer)
    else if (filterAssignee) list = list.filter(p => p.screening_reviewer === filterAssignee)
    if (filterDecision === '__pending') list = list.filter(p => !p.screening_decision)
    else if (filterDecision) list = list.filter(p => p.screening_decision === filterDecision)
    return list
  }, [participants, search, filterProg, filterYear, filterAssignee, filterDecision])

  const stats = useMemo(() => ({
    total: participants.length,
    yes: participants.filter(p => p.screening_decision === 'yes').length,
    no: participants.filter(p => p.screening_decision === 'no').length,
    maybe: participants.filter(p => p.screening_decision === 'maybe').length,
    pending: participants.filter(p => !p.screening_decision).length,
  }), [participants])

  const handleDecide = async (id, decision, remarks = '') => {
    await screeningMutation.mutateAsync({ id, data: {
      reviewer: user?.name || 'Kalyani B',
      decision,
      remarks,
    }})
  }

  const handleCardDecide = (id, decision) => handleDecide(id, decision)

  const handleAutoAssign = async (quotas) => {
    await autoAssignMutation.mutateAsync(quotas)
    setAutoAssignOpen(false)
  }

  const handleImportFromSheet = async () => {
    await importFromSheetMutation.mutateAsync(importUrl)
    setImportOpen(false)
  }

  const handleResetParticipants = async () => {
    if (!confirm('Remove all imported participants? This will clear screening, interview, and selection data.')) return
    await resetParticipantsMutation.mutateAsync()
  }

  const openProfile = (p) => {
    setSelectedP(p)
    setProfileOpen(true)
  }

  const selectColor = { color: '#6a0f21' }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-maroon mb-1">Screening</h1>
          <p className="text-charcoal-light text-sm">{participants.length} applications</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-taupe bg-white text-charcoal font-semibold text-sm hover:border-maroon hover:bg-cream transition-all"
          >
            <i className="fas fa-file-import" />
            Import from Sheet
          </button>
          {isAdmin && (
            <button
              onClick={handleResetParticipants}
              disabled={resetParticipantsMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:border-red-400 hover:bg-red-100 transition-all disabled:opacity-60"
            >
              <i className={`fas ${resetParticipantsMutation.isPending ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
              {resetParticipantsMutation.isPending ? 'Resetting...' : 'Reset App Data'}
            </button>
          )}
          <button
            onClick={() => setAutoAssignOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gold bg-gold/10 text-charcoal font-semibold text-sm hover:bg-gold/20 transition-all"
          >
            <i className="fas fa-magic text-gold" />
            Auto-Assign
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',   val: stats.total,   color: '#6a0f21', icon: 'fa-users' },
          { label: 'Yes',     val: stats.yes,     color: '#059669', icon: 'fa-check-circle' },
          { label: 'Maybe',   val: stats.maybe,   color: '#d97706', icon: 'fa-question-circle' },
          { label: 'No',      val: stats.no,      color: '#dc2626', icon: 'fa-times-circle' },
          { label: 'Pending', val: stats.pending, color: '#6b7280', icon: 'fa-clock' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-taupe-light p-4 text-center">
            <i className={`fas ${icon} text-xl mb-1.5 block`} style={{ color }} />
            <div className="font-serif text-2xl font-bold" style={{ color }}>{val}</div>
            <div className="text-xs text-charcoal-light font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-taupe text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, city..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold"
          />
        </div>
        <select value={filterProg} onChange={e => setFilterProg(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Programmes</option>
          {programmes.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Years</option>
          {['1','2','3','4'].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Assignees</option>
          {EVALUATORS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          <option value="__unassigned">Unassigned</option>
        </select>
        <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Decisions</option>
          <option value="yes">Yes</option>
          <option value="maybe">Maybe</option>
          <option value="no">No</option>
          <option value="__pending">Pending</option>
        </select>
        {(search || filterProg || filterYear || filterAssignee || filterDecision) && (
          <button onClick={() => { setSearch(''); setFilterProg(''); setFilterYear(''); setFilterAssignee(''); setFilterDecision('') }}
            className="px-3 py-2.5 bg-cream border border-taupe rounded-xl text-sm text-charcoal-light hover:text-charcoal transition-all">
            <i className="fas fa-times mr-1" />Clear
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-charcoal-light mb-4">
        Showing <strong>{filtered.length}</strong> of <strong>{participants.length}</strong> participants
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="fa-filter" message="No participants match your filters" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ParticipantCard
              key={p.id}
              p={p}
              onDecide={handleCardDecide}
              onOpenProfile={openProfile}
            />
          ))}
        </div>
      )}

      <AutoAssignModal
        open={autoAssignOpen}
        onClose={() => setAutoAssignOpen(false)}
        onAssign={handleAutoAssign}
        loading={autoAssignMutation.isPending}
        totalParticipants={participants.length}
      />

      <ImportSheetModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        importUrl={importUrl}
        setImportUrl={setImportUrl}
        onImport={handleImportFromSheet}
        loading={importFromSheetMutation.isPending}
      />

      <ProfileModal
        participant={selectedP}
        open={profileOpen}
        onClose={() => { setProfileOpen(false); setSelectedP(null) }}
        onDecide={async (id, decision, remarks) => {
          await handleDecide(id, decision, remarks)
        }}
      />
    </div>
  )
}
