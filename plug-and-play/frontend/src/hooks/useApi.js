import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, teamApi, commsApi, infraApi, logsApi, usersApi, applicationsApi } from '../api/services'
import toast from 'react-hot-toast'

// ── Tasks ─────────────────────────────────────────────────────────────────────
export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getAll(filters),
  })
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
