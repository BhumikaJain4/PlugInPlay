import { useAuth } from '../context/AuthContext'
import { useUsers, useUpdateUserRole, useDeleteUser } from '../hooks/useApi'
import { Spinner, EmptyState, Select, Button } from '../components/ui'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading } = useUsers()
  const updateRole = useUpdateUserRole()
  const deleteUser = useDeleteUser()

  const handleRoleChange = async (userId, role) => {
    await updateRole.mutateAsync({ id: userId, role })
  }

  const handleDeleteUser = async (targetUser) => {
    const confirmed = window.confirm(`Remove ${targetUser.name} (${targetUser.email}) from the system?`)
    if (!confirmed) return
    await deleteUser.mutateAsync(targetUser.id)
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-serif text-5xl text-maroon mb-2">Admin Users</h1>
        <p className="text-charcoal-light text-lg opacity-80">Manage user roles for admin access</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-taupe-light">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="fa-users" message="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-taupe-light text-charcoal-light text-sm">
                  <th className="py-3 pr-4 font-semibold">Name</th>
                  <th className="py-3 pr-4 font-semibold">Email</th>
                  <th className="py-3 pr-4 font-semibold">Current Role</th>
                  <th className="py-3 pr-4 font-semibold">Set Role</th>
                  <th className="py-3 pr-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u.id === currentUser?.id
                  const isUpdating = updateRole.isPending && updateRole.variables?.id === u.id
                  const isDeleting = deleteUser.isPending && deleteUser.variables === u.id
                  return (
                    <tr key={u.id} className="border-b border-taupe-light/60 last:border-b-0">
                      <td className="py-4 pr-4 text-charcoal font-medium">{u.name}</td>
                      <td className="py-4 pr-4 text-charcoal-light">{u.email}</td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${u.role === 'admin' ? 'bg-gold/20 text-maroon border-gold/40' : 'bg-cream text-charcoal-light border-taupe'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <Select
                          value={u.role}
                          disabled={isUpdating || isDeleting || (isSelf && u.role === 'admin')}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="max-w-[180px]"
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </Select>
                        {isSelf && u.role === 'admin' && (
                          <p className="text-xs text-charcoal-light mt-1">Your own admin access is protected.</p>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <Button
                          type="button"
                          variant="danger"
                          disabled={isSelf || isUpdating || isDeleting}
                          onClick={() => handleDeleteUser(u)}
                          className="px-3 py-2 text-xs"
                        >
                          <i className="fas fa-user-minus" />
                          {isDeleting ? 'Removing...' : 'Remove'}
                        </Button>
                        {isSelf && (
                          <p className="text-xs text-charcoal-light mt-1">You cannot delete your own account.</p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
