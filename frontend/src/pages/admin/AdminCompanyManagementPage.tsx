import React, { useEffect, useState } from 'react'
import { approveCompany, fetchAdminCompanies, toggleCompanyLock } from '../../features/auth/api/auth'

const AdminCompanyManagementPage: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCompanies = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminCompanies({ page, limit: 10, q: search, status })
      setCompanies(data.companies)
      setTotal(data.total)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch companies')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [page, search, status])

  const handleApprove = async (companyId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await approveCompany(companyId, newStatus)
      setCompanies(companies.map(c => c.id === companyId ? { ...c, status: newStatus } : c))
    } catch (err: any) {
      alert(err.message || 'Failed to update company status')
    }
  }

  const handleToggleLock = async (companyId: string, currentLockStatus: boolean) => {
    try {
      await toggleCompanyLock(companyId, !currentLockStatus)
      setCompanies(companies.map(c => c.id === companyId ? { ...c, is_locked: !currentLockStatus } : c))
    } catch (err: any) {
      alert(err.message || 'Failed to update company lock status')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Company Management</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by company name..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 opacity-40">🔍</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Security</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading companies...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No companies found</td></tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-800">{company.name}</p>
                      <p className="text-sm text-slate-500">{company.industry}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {company.location}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      company.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      company.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {company.is_locked ? (
                      <span className="text-red-500 text-xs font-bold uppercase flex items-center space-x-1">
                        <span>🔒</span> <span>Locked</span>
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs font-bold uppercase flex items-center space-x-1">
                        <span>✅</span> <span>Safe</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {company.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(company.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleLock(company.id, company.is_locked)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          company.is_locked 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {company.is_locked ? 'Unlock' : 'Lock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">Showing {companies.length} of {total} companies</p>
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

export default AdminCompanyManagementPage
