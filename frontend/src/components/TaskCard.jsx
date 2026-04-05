import { useState } from 'react'
import { Badge } from './ui'
import { useCompleteTask, useDeleteTask } from '../hooks/useApi'
import { LINK_ICONS } from '../utils/helpers'

export default function TaskCard({ task, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const complete = useCompleteTask()
  const remove = useDeleteTask()

  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer
        ${expanded ? 'border-maroon shadow-xl shadow-maroon/12' : 'border-taupe-light hover:border-gold hover:shadow-lg hover:shadow-maroon/6'}`}
    >
      {/* Summary Row */}
      <div
        className="flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap sm:items-center sm:gap-5 sm:p-6"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Chevron */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300
          ${expanded ? 'bg-maroon text-cream rotate-180' : 'bg-cream text-maroon'}`}>
          <i className="fas fa-chevron-down text-sm" />
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h3 className="font-serif text-base font-semibold text-charcoal sm:text-lg">{task.title}</h3>
            <Badge variant="default">
              <i className="fas fa-calendar text-gold" />
              {task.due_date}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-light sm:gap-6 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-user text-gold" />
              {task.assigned_to}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fas fa-tag text-gold" />
              {task.module}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <Badge variant={isCompleted ? 'completed' : 'pending'} className="shrink-0">
          <i className={`fas fa-${isCompleted ? 'check-circle' : 'clock'}`} />
          {isCompleted ? 'Completed' : 'Pending'}
        </Badge>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="bg-gradient-to-b from-cream to-white border-t border-taupe-light animate-fade-in">
          <div className="p-4 pt-4 sm:p-6 sm:pt-4">
            {/* Detail text */}
            <div className="mb-5">
              <p className="text-[0.7rem] uppercase tracking-widest text-charcoal-light font-semibold mb-2">Task Details</p>
              <div
                className="text-charcoal leading-relaxed text-sm [&_ul]:list-none [&_li]:pl-5 [&_li]:relative [&_li]:mb-1.5 [&_li]:before:content-['•'] [&_li]:before:text-gold [&_li]:before:font-bold [&_li]:before:absolute [&_li]:before:left-0"
                dangerouslySetInnerHTML={{ __html: task.detail }}
              />
            </div>

            {/* Reference links */}
            {task.links?.length > 0 && (
              <div className="mb-5">
                <p className="text-[0.7rem] uppercase tracking-widest text-charcoal-light font-semibold mb-2">Reference Materials</p>
                <div className="flex gap-3 flex-wrap">
                  {task.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-taupe rounded-lg text-maroon text-sm font-medium no-underline hover:bg-maroon hover:text-cream hover:border-maroon transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <i className={`fas ${LINK_ICONS[link.type] || 'fa-link'}`} />
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action panel */}
            <div className="bg-white border-2 border-taupe-light rounded-2xl p-5">
              <p className="font-serif text-lg text-maroon mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-gold" /> Actions Available
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {!isCompleted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); complete.mutate(task.id) }}
                    disabled={complete.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-maroon bg-maroon px-5 py-3 text-sm font-semibold text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-maroon-dark hover:shadow-lg hover:shadow-maroon/30 disabled:opacity-50 sm:w-auto sm:min-w-[160px] sm:flex-1"
                  >
                    <i className="fas fa-check-circle" />
                    {complete.isPending ? 'Saving...' : 'Mark as Solved'}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-taupe bg-white px-5 py-3 text-sm font-semibold text-charcoal transition-all duration-200 hover:border-maroon hover:bg-cream hover:text-maroon sm:w-auto sm:min-w-[160px] sm:flex-1"
                >
                  <i className="fas fa-edit" /> Edit Task
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) remove.mutate(task.id) }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-taupe bg-white px-5 py-3 text-sm font-semibold text-red-500 transition-all duration-200 hover:border-red-400 hover:bg-red-50 sm:w-auto"
                >
                  <i className="fas fa-trash-alt" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
