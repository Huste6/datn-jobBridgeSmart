import React, { useState } from 'react'
import type { AppPage } from '../../shared/routes/appRoutes'
import type { AuthUser } from '../../features/auth/api/auth'
import { loginUser } from '../../features/auth/api/auth'

interface AdminLoginPageProps {
  onNavigate: (page: AppPage) => void
  onAuthSuccess: (user: AuthUser) => void
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate, onAuthSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const user = await loginUser({ email, password })
      if (user.role !== 'admin') {
        setError('Unauthorized: Admin access required')
        setIsLoading(false)
        return
      }
      onAuthSuccess(user)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="mt-2 text-blue-100 opacity-80 uppercase tracking-widest text-sm">System Management</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@jobbridge.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {isLoading ? 'Authenticating...' : 'Sign In Now'}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              Back to Main Site
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage
