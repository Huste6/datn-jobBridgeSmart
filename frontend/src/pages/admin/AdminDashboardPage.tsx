import React, { useEffect, useState } from 'react'
import type { AdminStats } from '../../features/auth/api/auth'
import { fetchAdminStats } from '../../features/auth/api/auth'

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAdminStats()
        setStats(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch statistics')
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">Synchronizing Data...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-100 p-10 rounded-3xl text-center max-w-2xl mx-auto mt-10">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl text-red-500">⚠️</span>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">Connection Interrupted</h3>
      <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
      >
        Retry Connection
      </button>
    </div>
  )

  const cards = [
    { title: 'Total Users', value: stats?.total_users || 0, gradient: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/30', icon: '👤' },
    { title: 'Total Companies', value: stats?.total_companies || 0, gradient: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/30', icon: '🏢' },
    { title: 'Total Jobs', value: stats?.total_jobs || 0, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30', icon: '💼' },
  ]

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, idx) => (
          <div 
            key={card.title} 
            className={`bg-white p-8 rounded-4xl shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 group animate-in fade-in slide-in-from-bottom-4 delay-${idx * 100}`}
          >
            <div>
              <p className="text-slate-400 font-bold text-[10px] mb-2 uppercase tracking-[0.2em]">{card.title}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{card.value.toLocaleString()}</h3>
            </div>
            <div className={`w-14 h-14 bg-linear-to-br ${card.gradient} text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-500`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboardPage
