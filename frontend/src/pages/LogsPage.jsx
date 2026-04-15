import { useMemo, useState } from 'react'
import { useLogs } from '../hooks/useApi'
import { Spinner, EmptyState } from '../components/ui'
import { formatDateIST } from '../utils/helpers'

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_status_changed', label: 'Task Status Changed' },
  { value: 'task_deleted', label: 'Task Deleted' },
  { value: 'communication_created', label: 'Created' },
  { value: 'communication_updated', label: 'Updated' },
  { value: 'communication_status_changed', label: 'Status Changed' },
  { value: 'communication_deleted', label: 'Deleted' },
]

export default function LogsPage() {
  const [action, setAction] = useState('all')
  const params = useMemo(() => ({ limit: 200, ...(action !== 'all' ? { action } : {}) }), [action])
  const { data: logs = [], isLoading } = useLogs(params)

  return (
    <div>
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="font-serif text-5xl text-maroon mb-2">Activity Logs</h1>
          <p className="text-charcoal-light text-lg opacity-80">Track what was done and by whom</p>
        </div>

        <select
          value={action}
          onChange={e => setAction(e.target.value)}
          className="px-4 py-2.5 bg-cream border-2 border-taupe-light rounded-xl text-sm focus:outline-none focus:border-gold transition-all"
        >
          {ACTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-taupe-light">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon="fa-clipboard-list" message="No activity found" />
        ) : (
          <div className="flex flex-col gap-3.5">
            {logs.map(log => (
              <div key={log.id} className="p-4 rounded-2xl border border-taupe-light bg-cream/40">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{log.message}</p>
                    <p className="text-xs text-charcoal-light mt-1">
                      By {log.performed_by?.name} ({log.performed_by?.role}) • {log.performed_by?.email}
                    </p>
                  </div>
                    <span className="text-xs text-charcoal-light whitespace-nowrap">
                      {formatDateIST(log.created_at)}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
