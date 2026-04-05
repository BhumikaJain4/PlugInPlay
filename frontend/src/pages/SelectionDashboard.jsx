import { useState, useMemo, useEffect, useRef } from 'react'
import { useParticipants, useToggleSelection } from '../hooks/useApi'
import { Spinner } from '../components/ui'

// Lightweight pie chart component using CSS conic-gradient
function MiniDonut({ data, size = 120 }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="text-xs text-charcoal-light">No data</span>
    </div>
  )
  let angle = 0
  const slices = data
    .filter(d => d.value > 0)
    .map(d => {
      const start = angle
      angle += (d.value / total) * 360
      return `${d.color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`
    })
    .join(', ')

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div
        className="rounded-full border border-taupe-light/60 shadow-sm"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${slices})`,
          transition: 'all 0.3s ease',
        }}
      />
      <div className="mt-1 text-center">
        <span className="text-sm font-bold font-serif text-charcoal">{total}</span>
        <span className="ml-1 text-[10px] text-charcoal-light">total</span>
      </div>
    </div>
  )
}

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="text-xs text-charcoal-light truncate w-28 text-right shrink-0" title={d.label}>{d.label}</div>
          <div className="flex-1 h-5 bg-cream-dark rounded-full overflow-hidden border border-taupe-light/40">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || '#6a0f21' }}
            />
          </div>
          <div className="text-xs font-bold text-charcoal w-8 shrink-0 text-right">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

function DistributionChart({ participants }) {
  // Score buckets: 0-4, 5-9, 10-14, 15-19, 20-24, 25
  const buckets = [
    { label: '0–4', range: [0, 4] },
    { label: '5–9', range: [5, 9] },
    { label: '10–14', range: [10, 14] },
    { label: '15–19', range: [15, 19] },
    { label: '20–24', range: [20, 24] },
    { label: '25', range: [25, 25] },
  ]
  const counts = buckets.map(b => ({
    label: b.label,
    value: participants.filter(p => p.interview_total_marks >= b.range[0] && p.interview_total_marks <= b.range[1]).length,
    color: '#6a0f21',
  }))
  const max = Math.max(...counts.map(c => c.value), 1)

  return (
    <div className="rounded-xl border border-taupe-light bg-cream/40 p-3">
      <div className="flex items-end gap-1.5 h-28">
      {counts.map((c, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold text-maroon">{c.value || ''}</div>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${Math.max(4, (c.value / max) * 80)}px`,
              background: 'linear-gradient(180deg, #b98b33 0%, #6a0f21 100%)',
              opacity: 0.92,
            }}
          />
          <div className="text-[9px] text-charcoal-light text-center leading-tight">{c.label}</div>
        </div>
      ))}
      </div>
    </div>
  )
}

function DecisionOutcomeBadge({ decision }) {
  const map = {
    yes: { label: 'Interview: Selected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    maybe: { label: 'Interview: Maybe', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    no: { label: 'Interview: Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
    pending: { label: 'Interview: Pending', cls: 'bg-cream text-charcoal-light border-taupe-light' },
  }
  const item = map[decision] || map.pending
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${item.cls}`}>
      {item.label}
    </span>
  )
}

function normalizeGender(value) {
  const raw = (value || '').toString().trim().toLowerCase()
  if (!raw) return 'unknown'
  if (raw === 'm' || raw === 'male') return 'male'
  if (raw === 'f' || raw === 'female') return 'female'
  if (raw === 'o' || raw === 'other' || raw === 'others' || raw === 'non-binary' || raw === 'non binary') return 'other'
  if (raw === 'na' || raw === 'n/a' || raw === 'prefer not to say' || raw === 'unknown') return 'unknown'
  return 'unknown'
}

function genderLabel(key) {
  if (key === 'male') return 'Male'
  if (key === 'female') return 'Female'
  if (key === 'other') return 'Other'
  return 'Unknown'
}

export default function SelectionDashboard() {
  const { data: participants = [], isLoading } = useParticipants()
  const toggleSelection = useToggleSelection()
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('score-desc')
  const [genderFilter, setGenderFilter] = useState('all')
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [copiedSelectedEmails, setCopiedSelectedEmails] = useState(false)
  const analyticsPanelRef = useRef(null)
  const [analyticsHeight, setAnalyticsHeight] = useState(null)

  // Participants who completed interview
  const scored = useMemo(() =>
    participants.filter(p => p.interview_scored_at || p.interview_total_marks > 0),
    [participants]
  )

  const filteredScored = useMemo(() => {
    let list = scored
    if (search.trim()) {
      const t = search.toLowerCase().trim()
      list = list.filter(p =>
        p.name.toLowerCase().includes(t) ||
        p.email.toLowerCase().includes(t) ||
        (p.program || '').toLowerCase().includes(t) ||
        (p.geography || '').toLowerCase().includes(t)
      )
    }
    if (genderFilter !== 'all') {
      list = list.filter(p => normalizeGender(p.gender) === genderFilter)
    }

    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'score-asc') return a.interview_total_marks - b.interview_total_marks
      return b.interview_total_marks - a.interview_total_marks
    })
    return sorted
  }, [scored, search, genderFilter, sortBy])

  const selected = filteredScored.filter(p => p.final_selected)
  const notSelected = filteredScored.filter(p => !p.final_selected)
  const selectedAll = useMemo(
    () => participants.filter(p => p.final_selected),
    [participants]
  )
  const selectedEmailsText = useMemo(
    () => selectedAll.map(p => p.email).filter(Boolean).join(', '),
    [selectedAll]
  )

  // Analytics over selected group
  const analytics = useMemo(() => {
    const group = selected.length > 0 ? selected : scored

    // Gender
    const genderMap = {}
    group.forEach(p => {
      const g = normalizeGender(p.gender)
      genderMap[g] = (genderMap[g] || 0) + 1
    })
    const genderColors = { male: '#3b82f6', female: '#e11d48', other: '#8b5cf6', unknown: '#9ca3af' }
    const genderData = Object.entries(genderMap).map(([k, v]) => ({
      label: genderLabel(k), value: v, color: genderColors[k] || '#9ca3af'
    }))

    // Interview outcome
    const outcomeMap = { yes: 0, maybe: 0, no: 0 }
    group.forEach(p => {
      const key = p.interview_decision
      if (key in outcomeMap) outcomeMap[key] += 1
    })
    const outcomeData = [
      { label: 'Selected', value: outcomeMap.yes, color: '#059669' },
      { label: 'Maybe', value: outcomeMap.maybe, color: '#d97706' },
      { label: 'Rejected', value: outcomeMap.no, color: '#dc2626' },
    ]

    // Programme
    const progMap = {}
    group.forEach(p => {
      const pr = p.program || 'Other'
      progMap[pr] = (progMap[pr] || 0) + 1
    })
    const progColors = ['#6a0f21','#b98b33','#3b82f6','#059669','#8b5cf6','#f97316','#14b8a6','#e11d48','#6b7280']
    const progData = Object.entries(progMap)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v], i) => ({ label: k, value: v, color: progColors[i % progColors.length] }))

    // Geography (state)
    const geoMap = {}
    group.forEach(p => {
      const s = (p.geography || 'Unknown').split(',').pop().trim()
      geoMap[s] = (geoMap[s] || 0) + 1
    })
    const geoData = Object.entries(geoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ label: k, value: v, color: '#b98b33' }))

    return { genderData, outcomeData, progData, geoData }
  }, [selected, scored])

  const handleDragStart = (p, fromColumn) => {
    setDragging({ p, fromColumn })
  }

  const handleDrop = async (toColumn) => {
    if (!dragging) return
    if (dragging.fromColumn !== toColumn) {
      await toggleSelection.mutateAsync({ id: dragging.p.id, selected: toColumn === 'selected' })
    }
    setDragging(null)
    setDragOver(null)
  }

  const handleToggle = async (p) => {
    await toggleSelection.mutateAsync({ id: p.id, selected: !p.final_selected })
  }

  const copyEmail = async (email, id) => {
    await navigator.clipboard.writeText(email)
    setCopiedEmailId(id)
    window.setTimeout(() => setCopiedEmailId(null), 1200)
  }

  const copySelectedEmails = async () => {
    if (!selectedEmailsText) return
    await navigator.clipboard.writeText(selectedEmailsText)
    setCopiedSelectedEmails(true)
    window.setTimeout(() => setCopiedSelectedEmails(false), 1500)
  }

  useEffect(() => {
    const el = analyticsPanelRef.current
    if (!el) return

    const updateHeight = () => setAnalyticsHeight(el.getBoundingClientRect().height)
    updateHeight()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedAll.length, selected.length, scored.length, search, sortBy, genderFilter])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const scoreColor = (m) => {
    const pct = (m / 25) * 100
    return pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626'
  }

  const ColumnCard = ({ p, fromColumn }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(p, fromColumn)}
      className={`bg-white rounded-xl border border-taupe-light p-3.5 cursor-grab active:cursor-grabbing hover:border-gold hover:shadow-md transition-all duration-200 select-none ${
        dragging?.p?.id === p.id ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-charcoal truncate">{p.name}</p>
          <p className="text-xs text-charcoal-light truncate mt-0.5">{p.program} · Yr {p.year}</p>
        </div>
        <div className="shrink-0 text-center">
          <div className="text-lg font-bold font-serif" style={{ color: scoreColor(p.interview_total_marks) }}>
            {p.interview_total_marks}
          </div>
          <div className="text-[10px] text-charcoal-light">/25</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-xs text-charcoal-light">{p.email}</p>
        <button
          onClick={() => copyEmail(p.email, p.id)}
          className="shrink-0 rounded-full border border-taupe-light px-2.5 py-1 text-[10px] font-semibold text-maroon transition-all hover:border-maroon hover:bg-maroon hover:text-white"
        >
          {copiedEmailId === p.id ? 'Copied' : 'Copy email'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        <DecisionOutcomeBadge decision={p.interview_decision} />
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">{genderLabel(normalizeGender(p.gender))}</span>
        {p.geography && <span className="text-[10px] px-1.5 py-0.5 bg-cream border border-taupe-light text-charcoal-light rounded-full truncate max-w-[100px]">{p.geography}</span>}
      </div>
      <button
        onClick={() => handleToggle(p)}
        className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-semibold transition-all border ${
          fromColumn === 'selected'
            ? 'border-red-200 text-red-600 hover:bg-red-50'
            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        {fromColumn === 'selected'
          ? <><i className="fas fa-arrow-left mr-1" />Remove</>
          : <><i className="fas fa-arrow-right mr-1" />Select</>
        }
      </button>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-maroon mb-1">Selection Dashboard</h1>
          <p className="text-charcoal-light text-sm">Search, filter, sort, then drag candidates between columns</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, programme, geography"
          className="w-full rounded-xl border-2 border-taupe-light bg-white px-4 py-3 text-sm text-charcoal focus:border-maroon focus:outline-none"
        />
        <select
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
          className="w-full rounded-xl border-2 border-taupe-light bg-white px-4 py-3 text-sm text-charcoal focus:border-maroon focus:outline-none"
        >
          <option value="all">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="w-full rounded-xl border-2 border-taupe-light bg-white px-4 py-3 text-sm text-charcoal focus:border-maroon focus:outline-none"
        >
          <option value="score-desc">Score: High to Low</option>
          <option value="score-asc">Score: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <div className="mb-6 rounded-2xl border border-taupe-light bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-charcoal">Selected Candidate Emails</h3>
            <p className="text-xs text-charcoal-light">{selectedAll.length} selected candidates</p>
          </div>
          <button
            onClick={copySelectedEmails}
            disabled={!selectedEmailsText}
            className="rounded-lg border border-maroon px-3 py-1.5 text-xs font-semibold text-maroon transition-all hover:bg-maroon hover:text-white disabled:cursor-not-allowed disabled:border-taupe-light disabled:text-charcoal-light disabled:hover:bg-transparent"
          >
            {copiedSelectedEmails ? 'Copied all emails' : 'Copy all selected emails'}
          </button>
        </div>
        <textarea
          readOnly
          value={selectedEmailsText}
          placeholder="No selected candidate emails yet"
          className="w-full min-h-[92px] rounded-xl border border-taupe-light bg-cream/40 px-3 py-2 text-xs text-charcoal-light focus:outline-none"
        />
      </div>

      {scored.length === 0 ? (
        <div className="text-center py-16 text-charcoal-light">
          <i className="fas fa-clipboard-list text-5xl mb-4 text-taupe block" />
          <h3 className="font-serif text-xl text-charcoal mb-2">No scored candidates yet</h3>
          <p className="text-sm">Complete interviews to see candidates here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 xl:items-start">
          {/* Main: two-column drag area */}
          <div
            className="grid grid-cols-2 gap-4 min-h-0 overflow-hidden"
            style={analyticsHeight ? { height: `${analyticsHeight}px` } : undefined}
          >
            {/* Not Selected */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver('not') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop('not-selected')}
              className={`h-full min-h-0 flex flex-col rounded-2xl border-2 border-dashed transition-all ${
                dragOver === 'not'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-taupe-light bg-cream/30'
              }`}
            >
              <div className="p-4 border-b border-taupe-light flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal text-sm">Not Selected</h3>
                  <p className="text-xs text-charcoal-light">{notSelected.length} candidates</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-cream-dark flex items-center justify-center">
                  <i className="fas fa-user-times text-charcoal-light text-sm" />
                </div>
              </div>
              <div className="flex-1 min-h-0 p-3 space-y-2.5 overflow-y-auto scrollbar-thin">
                {notSelected.length === 0 ? (
                  <div className="text-center py-8 text-charcoal-light text-xs">
                    <i className="fas fa-arrow-left text-2xl mb-2 block text-taupe" />
                    Drag from Selected to remove
                  </div>
                ) : (
                  notSelected
                    .map(p => <ColumnCard key={p.id} p={p} fromColumn="not-selected" />)
                )}
              </div>
            </div>

            {/* Selected */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver('sel') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop('selected')}
              className={`h-full min-h-0 flex flex-col rounded-2xl border-2 border-dashed transition-all ${
                dragOver === 'sel'
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-emerald-200 bg-emerald-50/30'
              }`}
            >
              <div className="p-4 border-b border-emerald-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal text-sm">Selected</h3>
                  <p className="text-xs text-charcoal-light">{selected.length} candidates</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-user-check text-emerald-600 text-sm" />
                </div>
              </div>
              <div className="flex-1 min-h-0 p-3 space-y-2.5 overflow-y-auto scrollbar-thin">
                {selected.length === 0 ? (
                  <div className="text-center py-8 text-charcoal-light text-xs">
                    <i className="fas fa-arrow-right text-2xl mb-2 block text-emerald-300" />
                    Drag candidates here to select
                  </div>
                ) : (
                  selected
                    .map(p => <ColumnCard key={p.id} p={p} fromColumn="selected" />)
                )}
              </div>
            </div>
          </div>

          {/* Right: analytics panel */}
          <div ref={analyticsPanelRef} className="space-y-4 self-start">
            {/* Gender */}
            <div className="bg-white rounded-2xl border border-taupe-light p-5">
              <h4 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-4">
                Gender Composition
                <span className="ml-1.5 font-normal text-[10px]">({selected.length > 0 ? 'selected' : 'all scored'})</span>
              </h4>
              <div className="flex items-center gap-4">
                <MiniDonut data={analytics.genderData} size={100} />
                <div className="space-y-1.5 flex-1">
                  {analytics.genderData.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-charcoal-light flex-1">{d.label}</span>
                      <span className="text-xs font-bold text-charcoal">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score distribution */}
            <div className="bg-white rounded-2xl border border-taupe-light p-5">
              <h4 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-4">Score Distribution</h4>
              <DistributionChart participants={selected.length > 0 ? selected : scored} />
            </div>

            {/* Interview outcome */}
            <div className="bg-white rounded-2xl border border-taupe-light p-5">
              <h4 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-4">Interview Outcome</h4>
              <BarChart data={analytics.outcomeData} maxVal={Math.max(1, ...(analytics.outcomeData || []).map(d => d.value))} />
            </div>

            {/* Programme */}
            <div className="bg-white rounded-2xl border border-taupe-light p-5">
              <h4 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-4">By Programme</h4>
              <BarChart data={analytics.progData.slice(0, 6)} />
            </div>

            {/* Geography */}
            <div className="bg-white rounded-2xl border border-taupe-light p-5">
              <h4 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-4">By Geography</h4>
              <BarChart data={analytics.geoData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
