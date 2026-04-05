import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, teamApi, commsApi, infraApi, logsApi, usersApi, applicationsApi, participantsApi } from '../api/services'
import toast from 'react-hot-toast'

// ── Tasks ─────────────────────────────────────────────────────────────────────
export function useTasks(filters = {}) {
  return useQuery({ queryKey: ['tasks', filters], queryFn: () => tasksApi.getAll(filters) })
}
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created!') },
    onError: () => toast.error('Failed to create task'),
  })
}
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to update task'),
  })
}
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => tasksApi.markComplete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task marked complete!') },
    onError: () => toast.error('Failed to update task'),
  })
}
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted') },
    onError: () => toast.error('Failed to delete task'),
  })
}

// ── Team ──────────────────────────────────────────────────────────────────────
export function useTeam() {
  return useQuery({ queryKey: ['team'], queryFn: teamApi.getAll })
}
export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Member added!') },
    onError: () => toast.error('Failed to add member'),
  })
}
export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => teamApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Member updated!') },
    onError: () => toast.error('Failed to update member'),
  })
}
export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Member removed') },
    onError: () => toast.error('Failed to remove member'),
  })
}

// ── Communications ────────────────────────────────────────────────────────────
export function useComms(filters = {}) {
  return useQuery({ queryKey: ['comms', filters], queryFn: () => commsApi.getAll(filters) })
}
export function useCreateComm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: commsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms'] }); toast.success('Draft added!') },
    onError: () => toast.error('Failed to create draft'),
  })
}
export function useUpdateComm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => commsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comms'] }),
    onError: () => toast.error('Failed to update'),
  })
}
export function useDeleteComm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: commsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}
export function useSendCommEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: commsApi.send,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['comms'] })
      toast.success(`Email sent to ${d.recipient_email}`)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to send email'),
  })
}
export function useSendTestCommEmail() {
  return useMutation({
    mutationFn: commsApi.testSend,
    onSuccess: (d) => toast.success(`Test email sent to ${d.recipient_email}`),
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to send test email'),
  })
}
export function useCheckSmtpConfig() {
  return useMutation({
    mutationFn: commsApi.smtpCheck,
    onSuccess: (d) => {
      toast.success(d.login_ok ? 'SMTP login succeeded' : d.message || 'SMTP check completed')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'SMTP check failed'),
  })
}

// ── Infrastructure ────────────────────────────────────────────────────────────
export function useInfra(filters = {}) {
  return useQuery({ queryKey: ['infra', filters], queryFn: () => infraApi.getAll(filters) })
}
export function useCreateInfra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: infraApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['infra'] }); toast.success('Item added!') },
    onError: () => toast.error('Failed to add item'),
  })
}
export function useToggleInfra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, done }) => infraApi.toggle(id, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infra'] }),
    onError: () => toast.error('Failed to update item'),
  })
}
export function useDeleteInfra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: infraApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['infra'] }); toast.success('Item removed') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ── Activity Logs ─────────────────────────────────────────────────────────────
export function useLogs(filters = {}) {
  return useQuery({ queryKey: ['logs', filters], queryFn: () => logsApi.getAll(filters) })
}

// ── Users (Admin) ────────────────────────────────────────────────────────────
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: usersApi.getAll })
}
export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['logs'] })
      toast.success('User role updated')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update role'),
  })
}
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['logs'] })
      toast.success('User removed')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to remove user'),
  })
}

// ── Applications ─────────────────────────────────────────────────────────────
export function useApplicationsSheet() {
  return useQuery({ queryKey: ['applications-sheet'], queryFn: applicationsApi.getSheet })
}
export function useSaveApplicationsSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url) => applicationsApi.saveSheet(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications-sheet'] })
      toast.success('Applications link saved')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save link'),
  })
}

// ── Participants ──────────────────────────────────────────────────────────────
export function useParticipants(params = {}) {
  return useQuery({
    queryKey: ['participants', params],
    queryFn: () => participantsApi.getAll(params),
    staleTime: 10_000,
  })
}
export function useBulkCreateParticipants() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: participantsApi.bulkCreate,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      toast.success(`Imported ${d.count} participants`)
    },
    onError: () => toast.error('Import failed'),
  })
}
export function useImportParticipantsFromSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url) => participantsApi.importFromSheet(url),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      toast.success(`Imported ${d.count}${d.updated ? `, updated ${d.updated}` : ''}${d.skipped ? `, skipped ${d.skipped}` : ''}`)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Sheet import failed'),
  })
}
export function useResetParticipants() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: participantsApi.resetAll,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['applications-sheet'] })
      toast.success('Application data reset')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to reset app data'),
  })
}
export function useAutoAssign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: participantsApi.autoAssign,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      toast.success(`Auto-assigned ${d.assigned} participants`)
    },
    onError: () => toast.error('Auto-assign failed'),
  })
}
export function useScreeningDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => participantsApi.screening(id, data),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      if (p.screening_decision === 'yes') {
      } else {
        toast.success('Decision saved')
      }
    },
    onError: () => toast.error('Failed to update screening'),
  })
}
export function useInterviewScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => participantsApi.interview(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      toast.success('Interview score saved!')
    },
    onError: () => toast.error('Failed to save interview score'),
  })
}
export function useToggleSelection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, selected }) => participantsApi.selection(id, selected),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants'] }),
    onError: () => toast.error('Failed to update selection'),
  })
}
export function useFinalMail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: participantsApi.finalMail,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['participants'] })
      toast.success(`Emails sent to ${d.count} students!`)
    },
    onError: () => toast.error('Failed to send emails'),
  })
}
export function useInterviewQuestions() {
  return useQuery({ queryKey: ['interview-questions'], queryFn: participantsApi.getQuestions })
}
export function useUpdateQuestions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: participantsApi.updateQuestions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interview-questions'] })
      toast.success('Questions updated globally!')
    },
    onError: () => toast.error('Failed to update questions'),
  })
}
