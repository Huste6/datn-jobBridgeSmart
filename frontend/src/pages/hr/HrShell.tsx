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
        <div className="min-h-screen bg-white">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
                    <button onClick={() => onNavigate('hrLanding')} className="inline-flex items-center gap-2.5 text-left">
                        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
                            <Building2 className="w-5 h-5" />
                        </span>
                        <span className="font-bold text-slate-900 text-[19px] tracking-tight">JobBridge HR</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Landing ứng viên
                        </button>
                        <button
                            onClick={() => onNavigate('appProfile')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {currentUser?.full_name || 'Tài khoản'}
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-medium text-white inline-flex items-center gap-2 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
                <aside className="h-fit lg:sticky lg:top-24">
                    <p className="px-3 pb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">Menu Quản Trị</p>
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`w-full inline-flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    currentPage === item.page
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {iconMap[item.page]}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="space-y-6">
                    <div className="pb-5 border-b border-slate-100">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-slate-500 mt-2 text-base">{subtitle}</p>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    )
}

export default HrShell
