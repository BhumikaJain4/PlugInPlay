import { useState } from 'react'
import { useTasks, useTeam } from '../hooks/useApi'
import { StatBox, Spinner, EmptyState } from '../components/ui'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import CalendarWidget from '../components/CalendarWidget'
import { useAuth } from '../context/AuthContext'
import { AVATAR_COLORS, getInitials } from '../utils/helpers'

const TODAY_DAY = 20

const RESOURCES = [
  { icon: 'fa-file-powerpoint', cls: 'text-gold bg-gold/15',       title: 'Orientation PPT 2025',    desc: 'Base template for 2026 updates',    url: 'https://www.canva.com/design/DAGjk--VR0o/H8WuXeVfTAAQ71iU49hXWA/edit' },
  { icon: 'fa-palette',         cls: 'text-emerald-600 bg-emerald-600/15', title: 'Canva Design Kit',        desc: 'Instagram posts & stories',         url: 'https://www.canva.com/design/DAGi_QwZ6cQ/Dpsa59KZ5GZMN7mWz_4mnQ/edit' },
  { icon: 'fa-envelope-open-text', cls: 'text-maroon bg-maroon/15', title: 'Communication Doc 2026',  desc: 'SM & Orientation emails',           url: 'https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing' },
  { icon: 'fa-wpforms',         cls: 'text-amber-600 bg-amber-600/15', title: 'SM Application Form',    desc: 'Google Forms template',             url: 'https://docs.google.com/forms/d/e/1FAIpQLSfn0ccucd1O07qbHLvQVEvLuO6KqpLF0mnEMMsbLEUv71QzCQ/viewform?usp=sharing' },
  { icon: 'fa-file-alt',        cls: 'text-purple-600 bg-purple-600/15', title: 'Reference Doc 2025',     desc: 'Emails, rubric & templates',        url: 'https://docs.google.com/document/d/1kD0Gqfu9x5v4tCkeXn20tPyAfqy5WcH4pTgC17aRcL0/edit' },
  { icon: 'fa-calendar-check',  cls: 'text-blue-500 bg-blue-500/15', title: 'Orientation Plan 2026',  desc: 'SM orientation flow doc',           url: 'https://docs.google.com/document/d/1e6731tY01Ey6lAh6wNdcPQXO8fC0QAiRIUdajruH1JE/edit?usp=sharing' },
]

const FILTER_TABS = [
  { key: 'all',       label: 'All Tasks' },
  { key: 'today',     label: 'Today' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
]

export default function Dashboard() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: team = [] } = useTeam()

  const [filter, setFilter] = useState('all')
  const [selectedDay, setSelectedDay] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  // Stats
  const total     = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const dueToday  = tasks.filter(t => t.due_day === TODAY_DAY && t.due_month === 3 && t.status !== 'completed').length

  // Filtered tasks for timeline
  const filteredTasks = (() => {
    if (selectedDay) return tasks.filter(t => t.due_day === selectedDay && t.due_month === 3 && t.status !== 'completed')
    switch (filter) {
      case 'today':     return tasks.filter(t => t.due_day === TODAY_DAY && t.due_month === 3 && t.status !== 'completed')
      case 'upcoming':  return tasks.filter(t => (t.due_day > TODAY_DAY || t.due_month > 3) && t.status !== 'completed')
      case 'completed': return tasks.filter(t => t.status === 'completed')
      default:          return tasks
    }
  })()

  const handleDayClick = (day) => {
    setSelectedDay(d => d === day ? null : day)
    setFilter('all')
  }

  const handleFilterTab = (key) => {
    setFilter(key)
    setSelectedDay(null)
  }

  const openCreate = () => { setEditTask(null); setModalOpen(true) }
  const openEdit   = (task) => { setEditTask(task); setModalOpen(true) }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl leading-tight text-maroon sm:text-4xl xl:text-5xl">Student Mitr Orientation 2026</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Manage orientation activities with elegance and precision</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <button
            onClick={() => {
              const csv = ['ID,Status,Date,Title,Assigned To',
                ...tasks.map(t => `${t.id},${t.status},${t.due_date},"${t.title}","${t.assigned_to}"`)
              ].join('\n')
              const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: 'tasks.csv' })
              a.click()
            }}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-taupe bg-white px-4 py-3 text-sm font-semibold text-maroon transition-all hover:border-maroon hover:bg-cream-dark sm:px-5"
          >
            <i className="fas fa-download" /> Export Report
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
            <i className="fas fa-plus" /> New Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <StatBox icon="fa-clipboard-list" value={total}     label="Total Tasks" />
        <StatBox icon="fa-clock"          value={dueToday}  label="Due Today"   iconStyle={{ background:'rgba(185,139,51,.2)', color:'#b98b33' }} />
        <StatBox icon="fa-check-circle"   value={completed} label="Completed"   iconStyle={{ background:'rgba(5,150,105,.2)', color:'#059669' }} />
        <StatBox icon="fa-users"          value={team.length || 6} label="Team Members" iconStyle={{ background:'rgba(106,15,33,.2)', color:'#6a0f21' }} />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* Task Timeline */}
        <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h2 className="font-serif text-2xl text-maroon sm:text-3xl">
              {selectedDay ? `March ${selectedDay} — Tasks` : 'Task Timeline'}
            </h2>
            <div className="flex flex-wrap gap-2 rounded-xl bg-cream p-2">
              {FILTER_TABS.map(({ key, label }) => (
                <button key={key} onClick={() => handleFilterTab(key)}
                  className={`rounded-lg border-0 px-3 py-2 text-xs font-medium transition-all sm:px-5 sm:py-2.5 sm:text-sm
                    ${filter === key && !selectedDay ? 'bg-maroon text-cream' : 'bg-transparent text-charcoal-light hover:bg-cream-dark'}`}>
                  {label}
                </button>
              ))}
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-maroon hover:bg-cream-dark cursor-pointer border-0 bg-transparent">
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState icon="fa-check-circle" message="No tasks found for this filter" />
          ) : (
            <div className="flex flex-col gap-4">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Panels */}
        <div className="flex flex-col gap-6 lg:gap-8">

          {/* Calendar */}
          <div className="rounded-2xl border border-taupe-light bg-white p-5 sm:p-7">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl text-maroon">March 2026</h3>
              <i className="fas fa-chevron-right text-gold" />
            </div>
            <CalendarWidget tasks={tasks} onDayClick={handleDayClick} selectedDay={selectedDay} />
          </div>

          {/* Quick Resources */}
          <div className="rounded-2xl border border-taupe-light bg-white p-5 sm:p-7">
            <h3 className="font-serif text-xl text-maroon mb-6">Quick Resources</h3>
            <div className="flex flex-col gap-3.5">
              {RESOURCES.map(({ icon, cls, title, desc, url }) => (
                <a key={title} href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 p-4 bg-cream rounded-xl border border-taupe-light hover:bg-white hover:border-gold hover:translate-x-1.5 hover:shadow-md hover:shadow-maroon/8 transition-all duration-200 no-underline text-inherit group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${cls}`}>
                    <i className={`fas ${icon}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal mb-0.5">{title}</h4>
                    <p className="text-xs text-charcoal-light">{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-2xl border border-taupe-light bg-white p-5 sm:p-7">
            <h3 className="font-serif text-xl text-maroon mb-6">Team Members</h3>
            <div className="flex flex-col gap-3.5">
              {team.length > 0 ? team.map(m => {
                const pendingCount = tasks.filter(t =>
                  t.assigned_to?.toLowerCase().includes(m.name.split(' ')[0].toLowerCase()) &&
                  t.status !== 'completed'
                ).length
                return (
                  <div key={m.id} className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-cream transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm border-2 border-gold shrink-0"
                      style={{ background: AVATAR_COLORS[m.avatar_color] || AVATAR_COLORS.maroon }}>
                      {getInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-charcoal truncate">{m.name}</h4>
                      <p className="text-xs text-charcoal-light">{m.dept}</p>
                    </div>
                    <span className="bg-cream-dark text-maroon text-xs font-bold px-3 py-1.5 rounded-full border border-taupe shrink-0">
                      {pendingCount} task{pendingCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              }) : (
                // Fallback static list if team API hasn't loaded yet
                [['JN','Jahnvi Nagdev','ME Department','maroon'],['SP','Sanskriti Patidar','Coordinator','pink'],
                 ['RP','Rushal Panchal','SEDC','gold'],['AD','Annanya Deshmukh','SEDC','green']].map(([init,name,dept,color]) => (
                  <div key={name} className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-cream transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm border-2 border-gold shrink-0"
                      style={{ background: AVATAR_COLORS[color] }}>{init}</div>
                    <div className="flex-1"><h4 className="text-sm font-semibold text-charcoal">{name}</h4><p className="text-xs text-charcoal-light">{dept}</p></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editTask={editTask} />
    </div>
  )
}
