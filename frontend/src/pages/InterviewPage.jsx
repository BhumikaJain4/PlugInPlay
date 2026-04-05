import { useState, useMemo, useEffect } from 'react'
import { useParticipants, useInterviewScore, useInterviewQuestions, useUpdateQuestions } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Modal, Spinner, EmptyState } from '../components/ui'

const EVALUATORS = ['Kalyani B', 'Ameresh K', 'KM']

function ScoreBar({ value, max = 5 }) {
  const pct = (value / max) * 100
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value}/{max}</span>
    </div>
  )
}

function QuestionsEditorModal({ open, onClose, questions, onSave, saving }) {
  const [local, setLocal] = useState(questions)

  const update = (i, val) => {
    const arr = [...local]
    arr[i] = val
    setLocal(arr)
  }

  const addQuestion = () => setLocal([...local, ''])
  const removeQuestion = (i) => setLocal(local.filter((_, idx) => idx !== i))

  return (
    <Modal open={open} onClose={onClose} title="Edit Interview Questions" maxWidth="max-w-2xl">
      <p className="text-charcoal-light text-sm mb-4">
        These questions apply globally across all interviewers. Each question is scored 0–5.
      </p>
      <div className="space-y-3 mb-6">
        {local.map((q, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="w-6 h-8 flex items-center justify-center text-xs font-bold text-charcoal-light shrink-0">{i + 1}</span>
            <input
              value={q}
              onChange={e => update(i, e.target.value)}
              className="flex-1 px-4 py-2 bg-cream border-2 border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold"
            />
            <button onClick={() => removeQuestion(i)}
              className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center text-xs shrink-0">
              <i className="fas fa-trash" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={addQuestion}
          className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-taupe text-charcoal-light text-sm hover:border-gold hover:text-charcoal transition-all">
          <i className="fas fa-plus mr-2" />Add Question
        </button>
        <button
          onClick={() => onSave(local.filter(q => q.trim()))}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-maroon text-white font-semibold text-sm hover:bg-maroon-dark disabled:opacity-50 flex items-center justify-center gap-2">
          <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
          {saving ? 'Saving...' : 'Save Globally'}
        </button>
      </div>
    </Modal>
  )
}

function ScoringModal({ participant: p, open, onClose, questions, onSave, saving }) {
  const { user } = useAuth()
  const [scores, setScores] = useState(() => Object.fromEntries(questions.map((_, i) => [i, 0])))
  const [remarks, setRemarks] = useState('')
  const [decision, setDecision] = useState('')
  const [reviewer, setReviewer] = useState(user?.name || 'Kalyani B')

  useEffect(() => {
    if (!open || !p) return

    const nextScores = Object.fromEntries(questions.map((_, i) => [i, 0]))
    if (Array.isArray(p.interview_questions)) {
      p.interview_questions.forEach((q, idx) => {
        const marks = Number(q?.marks ?? 0)
        nextScores[idx] = Number.isFinite(marks) ? Math.max(0, Math.min(5, marks)) : 0
      })
    }

    setScores(nextScores)
    setRemarks(p.interview_remarks || '')
    setDecision(p.interview_decision || '')
    setReviewer(p.interview_reviewer || user?.name || 'Kalyani B')
  }, [open, p?.id, questions, user?.name])

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const maxTotal = questions.length * 5

  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  const scoreColor = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626'

  if (!p) return null

  const handleSave = async () => {
    if (!decision) { return }
    const questionScores = questions.map((q, i) => ({ question: q, marks: scores[i] || 0 }))
    await onSave(p.id, { reviewer, decision, remarks, questions: questionScores })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="" maxWidth="max-w-2xl">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-taupe-light">
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 flex items-center justify-center font-bold text-xl text-maroon font-serif shrink-0">
          {p.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-maroon">{p.name}</h2>
          <p className="text-xs text-charcoal-light">{p.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {p.program && <span className="text-xs px-2 py-0.5 bg-cream rounded-full border border-taupe-light text-charcoal-light">{p.program}</span>}
            {p.year && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Yr {p.year}</span>}
            {p.cgpa && <span className="text-xs px-2 py-0.5 bg-cream rounded-full border border-taupe-light text-charcoal-light">CGPA {p.cgpa}</span>}
            {p.geography && <span className="text-xs px-2 py-0.5 bg-cream rounded-full border border-taupe-light text-charcoal-light">{p.geography}</span>}
          </div>
          {p.three_words && (
            <p className="text-xs italic text-charcoal-light mt-1">"{p.three_words}"</p>
          )}
        </div>
        {/* Live total score */}
        <div className="text-center shrink-0">
          <div className="text-3xl font-bold font-serif" style={{ color: scoreColor }}>{total}</div>
          <div className="text-xs text-charcoal-light">/{maxTotal}</div>
        </div>
      </div>

      {/* Interviewer selector */}
      <div className="flex gap-2 mb-5">
        {EVALUATORS.map(ev => (
          <button
            key={ev}
            onClick={() => setReviewer(ev)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              reviewer === ev
                ? 'bg-maroon text-white border-maroon'
                : 'bg-white text-charcoal-light border-taupe-light hover:border-taupe'
            }`}
          >
            {ev}
          </button>
        ))}
      </div>

      {/* Score each question */}
      <div className="space-y-4 mb-5">
        {questions.map((q, i) => (
          <div key={i} className="bg-cream rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-charcoal flex-1 mr-4">{i + 1}. {q}</p>
              <span className="text-xs text-charcoal-light shrink-0">0–5</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[0,1,2,3,4,5].map(v => (
                  <button
                    key={v}
                    onClick={() => setScores(s => ({ ...s, [i]: v }))}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border ${
                      scores[i] === v
                        ? v >= 4 ? 'bg-emerald-500 text-white border-emerald-500'
                          : v >= 2 ? 'bg-amber-400 text-white border-amber-400'
                          : 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-charcoal border-taupe-light hover:border-gold'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <ScoreBar value={scores[i]} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remarks */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">Remarks</label>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          placeholder="Interview observations..."
          rows={3}
          className="w-full px-4 py-3 bg-cream border-2 border-taupe-light rounded-xl text-sm focus:outline-none focus:border-gold resize-none"
        />
      </div>

      {/* Decision */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">Final Decision</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: 'yes',   label: 'Select',    icon: 'fa-check',  base: 'border-emerald-200 text-emerald-700', active: 'bg-emerald-500 text-white border-emerald-500' },
            { val: 'maybe', label: 'Waitlist',  icon: 'fa-minus',  base: 'border-amber-200 text-amber-700',     active: 'bg-amber-400 text-white border-amber-400' },
            { val: 'no',    label: 'Reject',    icon: 'fa-times',  base: 'border-red-200 text-red-600',         active: 'bg-red-500 text-white border-red-500' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setDecision(opt.val)}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                decision === opt.val ? opt.active : opt.base + ' hover:bg-cream'
              }`}
            >
              <i className={`fas ${opt.icon}`} />{opt.label}
            </button>
          ))}
        </div>
        {!decision && <p className="text-xs text-red-500 mt-1.5">Please select a decision before saving</p>}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !decision}
        className="w-full py-3.5 rounded-xl bg-maroon text-white font-semibold hover:bg-maroon-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
        {saving ? 'Saving...' : `Save Interview Score (${total}/${maxTotal})`}
      </button>
    </Modal>
  )
}

export default function InterviewPage() {
  const { data: participants = [], isLoading } = useParticipants()
  const { data: questionsData } = useInterviewQuestions()
  const interviewMutation = useInterviewScore()
  const updateQuestionsMutation = useUpdateQuestions()

  const questions = questionsData?.questions || [
    'Self-Awareness and Willingness to Grow',
    'Sensitivity and Care for Others',
    'Clarity in Communication',
    'Sense of Responsibility and Initiative',
    'Orientation to Change and Enabling Others',
  ]

  const [search, setSearch] = useState('')
  const [filterReviewer, setFilterReviewer] = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [scoringOpen, setScoringOpen] = useState(false)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [selectedP, setSelectedP] = useState(null)

  // Only show people who were invited for interview (screening = yes)
  const invited = useMemo(() =>
    participants.filter(p => p.screening_decision === 'yes'),
    [participants]
  )

  const filtered = useMemo(() => {
    let list = invited
    if (search) {
      const t = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(t) ||
        p.email.toLowerCase().includes(t) ||
        (p.program || '').toLowerCase().includes(t) ||
        (p.geography || '').toLowerCase().includes(t)
      )
    }
    if (filterReviewer) list = list.filter(p => p.interview_reviewer === filterReviewer)
    if (filterDecision === '__unscored') list = list.filter(p => !p.interview_decision)
    else if (filterDecision) list = list.filter(p => p.interview_decision === filterDecision)
    return list
  }, [invited, search, filterReviewer, filterDecision])

  const stats = useMemo(() => ({
    total: invited.length,
    scored: invited.filter(p => p.interview_scored_at).length,
    selected: invited.filter(p => p.interview_decision === 'yes').length,
    avgScore: invited.filter(p => p.interview_total_marks > 0).length
      ? (invited.filter(p => p.interview_total_marks > 0)
          .reduce((a, p) => a + p.interview_total_marks, 0) /
         invited.filter(p => p.interview_total_marks > 0).length).toFixed(1)
      : '—',
  }), [invited])

  const openScoring = (p) => {
    setSelectedP(p)
    setScoringOpen(true)
  }

  const handleSaveScore = async (id, data) => {
    await interviewMutation.mutateAsync({ id, data })
  }

  const scoreColor = (marks) => {
    const pct = (marks / (questions.length * 5)) * 100
    return pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626'
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-maroon mb-1">Interview Scoring</h1>
          <p className="text-charcoal-light text-sm">{invited.length} candidates shortlisted for interview</p>
        </div>
        <button
          onClick={() => setQuestionsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-taupe-light bg-white text-charcoal font-semibold text-sm hover:border-gold transition-all"
        >
          <i className="fas fa-list-ol text-gold" />
          Edit Questions Globally
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Invited',  val: stats.total,    color: '#6a0f21', icon: 'fa-user-clock' },
          { label: 'Scored',   val: stats.scored,   color: '#3b82f6', icon: 'fa-clipboard-check' },
          { label: 'Selected', val: stats.selected, color: '#059669', icon: 'fa-user-check' },
          { label: 'Avg Score',val: stats.avgScore,  color: '#b98b33', icon: 'fa-chart-line' },
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
        <div className="relative flex-1 min-w-[240px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-taupe text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, programme, city..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold"
          />
        </div>
        <select value={filterReviewer} onChange={e => setFilterReviewer(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Interviewers</option>
          {EVALUATORS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)}
          className="px-3 py-2.5 bg-white border border-taupe-light rounded-xl text-sm text-charcoal focus:outline-none focus:border-gold">
          <option value="">All Status</option>
          <option value="__unscored">Not Scored Yet</option>
          <option value="yes">Selected</option>
          <option value="maybe">Waitlisted</option>
          <option value="no">Rejected</option>
        </select>
      </div>

      {/* Table/List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : invited.length === 0 ? (
        <EmptyState icon="fa-user-clock" message="No candidates invited yet. Mark candidates as Yes in Screening first." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="fa-filter" message="No candidates match your search" />
      ) : (
        <div className="bg-white rounded-2xl border border-taupe-light overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream border-b border-taupe-light">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider">Candidate</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider hidden sm:table-cell">Programme</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider hidden md:table-cell">Interviewer</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-charcoal-light uppercase tracking-wider">Score</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-charcoal-light uppercase tracking-wider">Decision</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-charcoal-light uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe-light">
              {filtered.map(p => {
                const scored = !!p.interview_scored_at
                const dec = p.interview_decision
                return (
                  <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-charcoal text-sm">{p.name}</div>
                      <div className="text-xs text-charcoal-light">{p.email}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs text-charcoal-light">{p.program} · Yr {p.year}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-charcoal-light">{p.interview_reviewer || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {scored ? (
                        <div>
                          <span className="font-bold text-lg font-serif" style={{ color: scoreColor(p.interview_total_marks) }}>
                            {p.interview_total_marks}
                          </span>
                          <span className="text-xs text-charcoal-light">/{questions.length * 5}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-charcoal-light">Not scored</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {dec ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          dec === 'yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          dec === 'no'  ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {dec === 'yes' ? 'Selected' : dec === 'no' ? 'Rejected' : 'Waitlisted'}
                        </span>
                      ) : (
                        <span className="text-xs text-charcoal-light">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openScoring(p)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          scored
                            ? 'border border-taupe-light text-charcoal hover:border-gold'
                            : 'bg-maroon text-white hover:bg-maroon-dark shadow-sm shadow-maroon/30'
                        }`}
                      >
                        <i className={`fas ${scored ? 'fa-edit' : 'fa-star'}`} />
                        {scored ? 'Edit' : 'Score'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <QuestionsEditorModal
        open={questionsOpen}
        onClose={() => setQuestionsOpen(false)}
        questions={questions}
        onSave={async (qs) => {
          await updateQuestionsMutation.mutateAsync(qs)
          setQuestionsOpen(false)
        }}
        saving={updateQuestionsMutation.isPending}
      />

      <ScoringModal
        participant={selectedP}
        open={scoringOpen}
        onClose={() => { setScoringOpen(false); setSelectedP(null) }}
        questions={questions}
        onSave={handleSaveScore}
        saving={interviewMutation.isPending}
      />
    </div>
  )
}
