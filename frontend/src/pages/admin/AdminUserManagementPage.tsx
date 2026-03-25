import React, { useEffect, useState } from 'react'
import type { AuthUser } from '../../features/auth/api/auth'
import { fetchAdminUsers, toggleUserLock } from '../../features/auth/api/auth'

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminUsers({ page, limit: 10, q: search })
      setUsers(data.users)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const handleToggleLock = async (userId: string, currentLockStatus: boolean) => {
    try {
      await toggleUserLock(userId, !currentLockStatus)
      setUsers(users.map(u => u.id === userId ? { ...u, is_locked: !currentLockStatus } : u))
    } catch (err: any) {
      alert(err.message || 'Failed to update lock status')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">User Management</h2>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 opacity-40">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-600">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.full_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'recruiter' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_locked ? (
                      <span className="text-red-500 text-xs font-bold uppercase flex items-center space-x-1">
                        <span>🔒</span> <span>Locked</span>
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs font-bold uppercase flex items-center space-x-1">
                        <span>✅</span> <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleLock(user.id, user.is_locked)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        user.is_locked 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      disabled={user.role === 'admin'}
                    >
                      {user.is_locked ? 'Unlock' : 'Lock Account'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">Showing {users.length} of {total} users</p>
        <div className="flex items-center space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={page * 10 >= total}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminUserManagementPage
