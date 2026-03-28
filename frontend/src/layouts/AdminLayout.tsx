import { useState, useRef, useEffect } from 'react'
import type { AppPage } from '../shared/routes/appRoutes'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
  onLogout: () => void
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage, onNavigate, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { id: 'adminDashboard', label: 'Dashboard', icon: '📊' },
    { id: 'adminUsers', label: 'Users', icon: '👥' },
    { id: 'adminCompanies', label: 'Companies', icon: '🏢' },
  ] as const

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* Sidebar - Sleek Dark Design */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col shadow-2xl z-50">
        <div className="p-8 pb-10">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onNavigate('adminDashboard')}>
            <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🚀</span>
            </div>
            <div className="text-xl font-black tracking-tight flex flex-col -space-y-1">
              <span className="text-blue-500 uppercase text-[10px] font-bold tracking-[0.2em] mb-1">JobBridge</span>
              <span className="group-hover:text-blue-400 transition-colors">ADMIN</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${currentPage === item.id
                  ? 'bg-blue-600/10 text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-white hover:bg-slate-900'
                }`}
            >
              {currentPage === item.id && (
                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/40" />
              )}
              <span className={`text-xl transition-transform group-hover:scale-110 duration-300 ${currentPage === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              <span className="tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">System Health</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Main API</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-600 h-full w-[94%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-600 font-bold tracking-[0.15em] uppercase mb-0.5">Console</span>
            <h1 className="text-xl font-black text-slate-900 capitalize tracking-tight">
              {menuItems.find(m => m.id === currentPage)?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 py-1.5 pl-1.5 pr-3 rounded-full hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-200 active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white ring-2 ring-white shadow-md">
                  <span className="font-black text-sm uppercase">A</span>
                </div>
                <div className="hidden md:flex flex-col items-start -space-y-1">
                  <span className="text-sm font-black text-slate-800 tracking-tight">Administrator</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">Super Admin</span>
                </div>
                <span className={`text-[10px] text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-black text-slate-800 truncate">admin@jobbridge.io</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-red-600" onClick={onLogout}>
                      <span className="opacity-60 group-hover:opacity-100">🚪</span>
                      <span className="text-sm font-semibold group-hover:font-bold">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px]">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
