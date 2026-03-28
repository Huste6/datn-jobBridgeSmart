import React, { useEffect, useState } from 'react'
import { fetchAdminCompanies } from '../../features/auth/api/auth'

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
    const timer = setTimeout(() => {
      loadCompanies()
    }, 300)
    return () => clearTimeout(timer)
  }, [page, search, status])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Corporate Directory</h2>
          <p className="text-slate-500 font-medium">Verify and moderate legal entities registered on the platform.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          <select
            className="w-full md:w-48 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-600 text-sm shadow-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending Verification</option>
            <option value="approved">✅ Verified</option>
            <option value="rejected">❌ Flagged</option>
          </select>

          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <span className="text-sm">🏢</span>
            </div>
            <input
              type="text"
              placeholder="Company name..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center space-x-3">
          <span>🚫</span>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Corporate Entity</th>
                <th className="px-8 py-5">Hq Location</th>
                <th className="px-8 py-5">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning network...</span>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entities detected</p>
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center font-black text-slate-500 border border-slate-200 shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-tight">{company.name}</p>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{company.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-slate-500 tabular-nums">
                      {company.location}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${company.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          company.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                        {company.status}
                      </span>
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entities: {companies.length} OF {total} RECORDED</p>
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

export default AdminCompanyManagementPage
