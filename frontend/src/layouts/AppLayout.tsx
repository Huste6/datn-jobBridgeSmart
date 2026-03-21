import { Home, Search, FileText, Briefcase, Users, LogOut, ShieldCheck } from 'lucide-react'
import type { AuthUser } from '../features/auth/api/auth'
import type { AppPage, UserRole } from '../shared/routes/appRoutes'
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
                    <span className="text-sm text-slate-600">{currentUser.full_name}</span>
                    <button
                        onClick={onLogout}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
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
