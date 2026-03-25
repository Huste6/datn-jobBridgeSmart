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

  if (isLoading) return <div className="text-slate-500">Loading dashboard...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  const cards = [
    { title: 'Total Users', value: stats?.total_users || 0, color: 'bg-blue-500', icon: '👤' },
    { title: 'Total Companies', value: stats?.total_companies || 0, color: 'bg-emerald-500', icon: '🏢' },
    { title: 'Total Jobs', value: stats?.total_jobs || 0, color: 'bg-amber-500', icon: '💼' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div>
              <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-bold text-slate-800">{card.value.toLocaleString()}</h3>
            </div>
            <div className={`w-12 h-12 ${card.color} text-white rounded-xl flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Authentication Service</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Job Service</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Gateway Service</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">Operational</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-sm text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Welcome Back, Admin</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Managing the JobsBridge platform. Use the sidebar to navigate through users, companies, and platform settings.
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Platform Version</p>
            <p className="text-sm font-medium">v1.0.4-stable</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
