import { Building2, BriefcaseBusiness, FilePlus2, LayoutDashboard, ListChecks, LogOut, UserSearch, Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'

const menuItems: Array<{ label: string; page: AppPage }> = [
    { label: 'Tạo company', page: 'hrCompanyCreate' },
    { label: 'Hồ sơ company', page: 'hrCompanyProfile' },
    { label: 'Danh sách job', page: 'hrCompanyJobs' },
    { label: 'Quản lý job', page: 'hrJobManagement' },
    { label: 'Ứng viên theo job', page: 'hrJobCandidates' },
]

const iconMap: Partial<Record<AppPage, ReactNode>> = {
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
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50/50">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-none px-4 lg:px-6 h-18 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onNavigate('hrLanding')} className="inline-flex items-center gap-2.5 text-left">
                            <span className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
                                <Building2 className="w-5 h-5" />
                            </span>
                            <span className="font-bold text-slate-900 text-[19px] tracking-tight">JobBridge HR</span>
                        </button>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors ml-2 cursor-pointer"
                            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Landing ứng viên
                        </button>
                        <button
                            onClick={() => onNavigate('appProfile')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            {currentUser?.full_name || 'Tài khoản'}
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-medium text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <div className={`max-w-none px-4 lg:px-6 py-6 grid gap-6 transition-all duration-300 ${
                isCollapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[240px_1fr]'
            }`}>
                <aside className="h-fit lg:sticky lg:top-24 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                    {!isCollapsed && (
                        <p className="px-3 pb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">Menu Quản Trị</p>
                    )}
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`w-full inline-flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                                    currentPage === item.page
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                                title={item.label}
                            >
                                <span className="shrink-0">{iconMap[item.page] ?? <LayoutDashboard className="w-4 h-4" />}</span>
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="space-y-6 min-w-0">
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
