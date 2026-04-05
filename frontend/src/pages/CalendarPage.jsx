import { useState } from 'react'
import { useTasks } from '../hooks/useApi'
import CalendarWidget from '../components/CalendarWidget'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Spinner, EmptyState } from '../components/ui'

export default function CalendarPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const [selectedDay, setSelectedDay] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const now = new Date()
  const calendarMonth = now.getMonth() + 1
  const calendarYear = now.getFullYear()
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now)

  const dayTasks = selectedDay
    ? tasks.filter(
      t =>
        Number(t.due_day) === Number(selectedDay) &&
        Number(t.due_month) === Number(calendarMonth) &&
        Number(t.due_year) === Number(calendarYear)
    )
    : []

  return (
    <div>
      <div className="mb-8 lg:mb-12">
        <div>
          <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">Calendar</h1>
          <p className="text-base text-charcoal-light opacity-80 sm:text-lg">{monthLabel} {calendarYear} schedule — click any day to see tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[500px_minmax(0,1fr)] xl:gap-10">

        {/* Big Calendar */}
        <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl text-maroon">{monthLabel} {calendarYear}</h2>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)}
                className="text-sm text-charcoal-light hover:text-maroon transition-colors cursor-pointer border-0 bg-transparent">
                Clear selection <i className="fas fa-times ml-1" />
              </button>
            )}
          </div>
          {isLoading ? <div className="flex justify-center py-8"><Spinner /></div>
            : <CalendarWidget
              tasks={tasks}
              month={calendarMonth}
              year={calendarYear}
              onDayClick={d => setSelectedDay(prev => prev === d ? null : d)}
              selectedDay={selectedDay}
            />}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-taupe-light pt-5 text-xs text-charcoal-light sm:gap-6">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-maroon inline-block" /> Today</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold inline-block" /> Selected</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gold/40 inline-block" /> Has tasks</span>
          </div>
        </div>

        {/* Day task panel */}
        <div>
          {selectedDay ? (
            <div>
              <h2 className="font-serif text-2xl text-maroon mb-6">
                {monthLabel} {selectedDay} — {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
              </h2>
              {dayTasks.length === 0 ? (
                <div className="rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
                  <EmptyState icon="fa-calendar-check" message="No tasks on this day" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {dayTasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={t => { setEditTask(t); setModalOpen(true) }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
              <div className="text-center text-charcoal-light">
                <i className="fas fa-hand-pointer text-5xl text-taupe mb-4 block" />
                <p className="text-base font-medium">Click a day on the calendar</p>
                <p className="text-sm mt-1 opacity-70">to see its tasks here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editTask={editTask} />
    </div>
  )
}
