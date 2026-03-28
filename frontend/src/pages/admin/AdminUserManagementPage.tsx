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
    const timer = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(timer)
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">User Registry</h2>
          <p className="text-slate-500 font-medium">Manage and monitor all platform accounts from a centralized node.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <span className="text-sm">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Identity search..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-slate-700 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center space-x-3">
          <span>🚫</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">User Manifest</th>
                <th className="px-8 py-5">Access Group</th>
                <th className="px-8 py-5">Registry Date</th>
                <th className="px-8 py-5">Node Status</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying database...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found in current scope</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center font-black text-slate-500 border border-slate-200 shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-tight">{user.full_name}</p>
                          <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        user.role === 'recruiter' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-slate-500 tabular-nums">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-5">
                      {user.is_locked ? (
                        <div className="flex items-center space-x-2 text-red-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Restricted</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-emerald-500">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Active Node</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleToggleLock(user.id, user.is_locked)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          user.is_locked 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' 
                          : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100'
                        } disabled:opacity-20 disabled:grayscale`}
                        disabled={user.role === 'admin'}
                      >
                        {user.is_locked ? 'Authorize' : 'Restrict'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry: {users.length} OF {total} ENTRIES</p>
        <div className="flex items-center space-x-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/20">
            {page}
          </div>
          <button
            disabled={page * 10 >= total}
            onClick={() => setPage(page + 1)}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminUserManagementPage
