import { Home, Search, FileText, Briefcase, Users, LogOut, ShieldCheck, UserCircle2, ChevronDown } from 'lucide-react'
import type { AuthUser } from '../features/auth/api/auth'
import type { AppPage, UserRole } from '../shared/routes/appRoutes'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Props = {
    currentUser: AuthUser
    role: UserRole
    currentPage: AppPage
    onNavigate: (page: AppPage) => void
    onLogout: () => void
    children: ReactNode
}

type MenuItem = {
    page: AppPage
    label: string
    icon: ReactNode
}

const AppLayout = ({ currentUser, role, currentPage, onNavigate, onLogout, children }: Props) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const profileMenuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (!profileMenuRef.current) {
                return
            }

            const target = event.target as Node
            if (!profileMenuRef.current.contains(target)) {
                setIsProfileMenuOpen(false)
            }
        }

        window.addEventListener('mousedown', onMouseDown)
        return () => {
            window.removeEventListener('mousedown', onMouseDown)
        }
    }, [])

    const initials = currentUser.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')

    const seekerMenu: MenuItem[] = [
        { page: 'appHome', label: 'Tổng quan', icon: <Home className="w-4 h-4" /> },
        { page: 'appJobs', label: 'Việc làm', icon: <Search className="w-4 h-4" /> },
        { page: 'appApplications', label: 'Đơn ứng tuyển', icon: <FileText className="w-4 h-4" /> },
    ]

    const recruiterMenu: MenuItem[] = [
        { page: 'appHome', label: 'Tổng quan', icon: <Home className="w-4 h-4" /> },
        { page: 'appRecruitment', label: 'Tin tuyển dụng', icon: <Briefcase className="w-4 h-4" /> },
        { page: 'appCandidates', label: 'Ứng viên', icon: <Users className="w-4 h-4" /> },
    ]

    const menu = role === 'recruiter' ? recruiterMenu : seekerMenu
    const roleLabel = role === 'recruiter' ? 'Nhà tuyển dụng' : 'Ứng viên'

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
                <button onClick={() => onNavigate('landing')} className="font-bold text-slate-900 text-lg">
                    JobBridge AI
                </button>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                        <ShieldCheck className="w-4 h-4" /> {roleLabel}
                    </span>
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                        >
                            <span className="w-8 h-8 shrink-0 overflow-hidden rounded-full bg-blue-600 text-white text-xs font-semibold grid place-items-center">
                                {currentUser.avatar_url ? (
                                    <img src={currentUser.avatar_url} alt="Avatar" className="block w-full h-full rounded-full object-cover object-center" />
                                ) : (
                                    initials || 'U'
                                )}
                            </span>
                            <span className="hidden sm:block text-sm text-slate-700 max-w-30 truncate">{currentUser.full_name}</span>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-50">
                                <div className="px-3 py-2 border-b border-slate-100">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsProfileMenuOpen(false)
                                        onNavigate('appProfile')
                                    }}
                                    className="w-full mt-1 px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                                >
                                    <UserCircle2 className="w-4 h-4" /> Trang cá nhân
                                </button>
                                <button
                                    onClick={() => {
                                        setIsProfileMenuOpen(false)
                                        onLogout()
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-[260px_1fr] min-h-[calc(100vh-4rem)]">
                <aside className="border-r border-slate-200 bg-white p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Điều hướng</p>
                    <nav className="space-y-1">
                        {menu.map((item) => {
                            const active = item.page === currentPage
                            return (
                                <button
                                    key={item.page}
                                    onClick={() => onNavigate(item.page)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    )
}

export default AppLayout
