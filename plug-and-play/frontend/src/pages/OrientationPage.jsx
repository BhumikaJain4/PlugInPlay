import { useState } from 'react'
import { useTasks } from '../hooks/useApi'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Spinner, EmptyState, StatBox } from '../components/ui'

export default function OrientationPage() {
  const { data: allTasks = [], isLoading } = useTasks()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filter, setFilter] = useState('all')

  const tasks = allTasks.filter(t => t.module === 'SM Orientation')
  const pending   = tasks.filter(t => t.status !== 'completed')
  const completed = tasks.filter(t => t.status === 'completed')

  const displayed = filter === 'completed' ? completed : filter === 'pending' ? pending : tasks

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">SM Orientation</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Student Mitr orientation management</p>
        </div>
        <button onClick={() => { setEditTask(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark sm:px-5">
          <i className="fas fa-plus" /> New Task
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        <StatBox icon="fa-tasks"        value={tasks.length}     label="Total Tasks" />
        <StatBox icon="fa-clock"        value={pending.length}   label="Pending"    iconStyle={{ background:'rgba(217,119,6,.15)', color:'#d97706' }} />
        <StatBox icon="fa-check-circle" value={completed.length} label="Completed"  iconStyle={{ background:'rgba(5,150,105,.2)', color:'#059669' }} />
      </div>

      <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl text-maroon">Orientation Tasks</h2>
          <div className="flex w-full flex-wrap gap-1.5 rounded-xl bg-cream p-1.5 sm:w-auto sm:flex-nowrap">
            {[['all','All'],['pending','Pending'],['completed','Completed']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`flex-1 rounded-lg border-0 px-4 py-2 text-sm font-medium transition-all sm:flex-none
                  ${filter === k ? 'bg-maroon text-cream' : 'bg-transparent text-charcoal-light hover:bg-cream-dark'}`}>{l}</button>
            ))}
          </div>
        </div>

        {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          : displayed.length === 0 ? <EmptyState icon="fa-graduation-cap" message="No tasks in this view" />
          : <div className="flex flex-col gap-4">{displayed.map(t => <TaskCard key={t.id} task={t} onEdit={x => { setEditTask(x); setModalOpen(true) }} />)}</div>}
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editTask={editTask} />
    </div>
  )
}
