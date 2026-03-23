import { useState } from 'react'
import { useTasks } from '../hooks/useApi'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Spinner, EmptyState } from '../components/ui'

const FILTERS = ['All','Pending','Completed']
const MODULES = ['All Modules','SM Orientation','Communications','Infrastructure']

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const [statusFilter, setStatusFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All Modules')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const filtered = tasks.filter(t => {
    if (statusFilter === 'Pending' && t.status !== 'pending') return false
    if (statusFilter === 'Completed' && t.status !== 'completed') return false
    if (moduleFilter !== 'All Modules' && t.module !== moduleFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.assigned_to.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl xl:text-5xl">All Tasks</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Complete task list — {tasks.length} total</p>
        </div>
        <button onClick={() => { setEditTask(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
          <i className="fas fa-plus" /> New Task
        </button>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-taupe-light bg-white p-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-5">
        {/* Search */}
        <div className="relative w-full flex-1 sm:min-w-[220px]">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-taupe text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks or assignees..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream border-2 border-taupe-light rounded-xl text-sm focus:outline-none focus:border-gold focus:bg-white transition-all" />
        </div>

        {/* Status filter */}
        <div className="flex w-full flex-wrap gap-1.5 rounded-xl bg-cream p-1.5 sm:w-auto sm:flex-nowrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`flex-1 rounded-lg border-0 px-4 py-2 text-sm font-medium transition-all sm:flex-none
                ${statusFilter === f ? 'bg-maroon text-cream' : 'bg-transparent text-charcoal-light hover:bg-cream-dark'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Module filter */}
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
          className="w-full rounded-xl border-2 border-taupe-light bg-cream px-4 py-2.5 text-sm transition-all focus:border-gold focus:outline-none sm:w-auto">
          {MODULES.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div className="w-full rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-search" message="No tasks match your filters" />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} onEdit={t => { setEditTask(t); setModalOpen(true) }} />
            ))}
          </div>
        )}
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editTask={editTask} />
    </div>
  )
}
