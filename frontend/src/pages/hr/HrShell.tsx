import { Building2, BriefcaseBusiness, FilePlus2, LayoutDashboard, ListChecks, LogOut, UserSearch } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'

const menuItems: Array<{ label: string; page: AppPage }> = [
    { label: 'Tạo company', page: 'hrCompanyCreate' },
    { label: 'Hồ sơ company', page: 'hrCompanyProfile' },
    { label: 'Danh sách job', page: 'hrCompanyJobs' },
    { label: 'Quản lý job', page: 'hrJobManagement' },
    { label: 'Ứng viên theo job', page: 'hrJobCandidates' },
]

const iconMap: Record<AppPage, ReactNode> = {
    landing: <LayoutDashboard className="w-4 h-4" />,
    hrLanding: <LayoutDashboard className="w-4 h-4" />,
    jobsList: <BriefcaseBusiness className="w-4 h-4" />,
    applications: <ListChecks className="w-4 h-4" />,
    login: <LayoutDashboard className="w-4 h-4" />,
    register: <LayoutDashboard className="w-4 h-4" />,
    unauthorized: <LayoutDashboard className="w-4 h-4" />,
    forbidden: <LayoutDashboard className="w-4 h-4" />,
    notfound: <LayoutDashboard className="w-4 h-4" />,
    roleSelect: <LayoutDashboard className="w-4 h-4" />,
    basicProfile: <LayoutDashboard className="w-4 h-4" />,
    appProfile: <LayoutDashboard className="w-4 h-4" />,
    hrCompanyCreate: <FilePlus2 className="w-4 h-4" />,
    hrCompanyProfile: <Building2 className="w-4 h-4" />,
    hrCompanyJobs: <BriefcaseBusiness className="w-4 h-4" />,
    hrJobManagement: <ListChecks className="w-4 h-4" />,
    hrJobCandidates: <UserSearch className="w-4 h-4" />,
    hrCandidateReview: <UserSearch className="w-4 h-4" />,
}

const HrShell = ({
    title,
    subtitle,
    currentPage,
    currentUser,
    onNavigate,
    onLogout,
    children,
}: {
    title: string
    subtitle: string
    currentPage: AppPage
    currentUser: AuthUser | null
    onNavigate: (page: AppPage) => void
    onLogout: () => void
    children: ReactNode
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                    <button onClick={() => onNavigate('hrLanding')} className="inline-flex items-center gap-2 text-left">
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white grid place-items-center">
                            <Building2 className="w-5 h-5" />
                        </span>
                        <span className="font-bold text-slate-900 text-lg">JobBridge HR</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            Landing ứng viên
                        </button>
                        <button
                            onClick={() => onNavigate('appProfile')}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            {currentUser?.full_name || 'Tai khoan'}
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm text-white inline-flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
                <aside className="bg-white border border-slate-200 rounded-2xl p-3 h-fit lg:sticky lg:top-22">
                    <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Menu HR</p>
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`w-full inline-flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    currentPage === item.page
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {iconMap[item.page]}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                        <p className="text-slate-600 mt-1">{subtitle}</p>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    )
}

export default HrShell
