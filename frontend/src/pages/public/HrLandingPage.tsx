import { Bot, BriefcaseBusiness, Building2, ClipboardList, Edit3, LogOut, UserSearch } from 'lucide-react'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'

const HrLandingPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate?: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => onNavigate?.('hrLanding')} className="inline-flex items-center gap-2 text-left">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-xl text-slate-900">JobBridge HR</span>
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => onNavigate?.('landing')}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            Landing ung vien
                        </button>
                        <button
                            onClick={() => onNavigate?.('appProfile')}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            {currentUser?.full_name || 'Hồ sơ'}
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

            <main>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
                    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
                        <p className="inline-flex items-center gap-2 text-blue-700 text-sm font-medium border border-blue-200 bg-blue-50 rounded-full px-3 py-1 mb-6">
                            <Bot className="w-4 h-4" /> Landing rieng cho nha tuyen dung
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-3xl text-slate-900">
                            Khong gian dieu hanh HR de quan ly company, job va ung vien
                        </h1>
                        <p className="mt-4 text-slate-600 max-w-3xl text-base sm:text-lg">
                            Tat ca chuc nang HR duoc tach rieng. Ung vien khong the truy cap vao khu vuc nay.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => onNavigate?.('hrCompanyCreate')}
                                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                Tao company
                            </button>
                            <button
                                onClick={() => onNavigate?.('hrCompanyJobs')}
                                className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold"
                            >
                                Xem danh sach job
                            </button>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Trang tao company</h2>
                            <p className="mt-2 text-slate-600">Khoi tao thong tin doanh nghiep su dung cho thuong hieu tuyen dung.</p>
                            <button onClick={() => onNavigate?.('hrCompanyCreate')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <ClipboardList className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Trang ho so company</h2>
                            <p className="mt-2 text-slate-600">Theo doi va kiem tra ho so cong ty hien thi trong moi job posting.</p>
                            <button onClick={() => onNavigate?.('hrCompanyProfile')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <BriefcaseBusiness className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Danh sach job cua cong ty</h2>
                            <p className="mt-2 text-slate-600">Tap trung danh sach job va thao tac nhanh sua xoa xem ung vien.</p>
                            <button onClick={() => onNavigate?.('hrCompanyJobs')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <Edit3 className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Tao hoac sua hoac xoa job</h2>
                            <p className="mt-2 text-slate-600">Form quan ly vong doi job posting tren cung mot man hinh.</p>
                            <button onClick={() => onNavigate?.('hrJobManagement')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <UserSearch className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Danh sach ung vien theo job</h2>
                            <p className="mt-2 text-slate-600">Loc ung vien theo vi tri dang tuyen de review nhanh.</p>
                            <button onClick={() => onNavigate?.('hrJobCandidates')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                        <article className="rounded-2xl border border-slate-200 bg-white p-6">
                            <Bot className="w-8 h-8 text-blue-600" />
                            <h2 className="mt-4 text-xl font-bold text-slate-900">HR: Chi tiet ho so va cham diem thu cong</h2>
                            <p className="mt-2 text-slate-600">Mo profile ung vien, cap nhat stage, diem va ghi chu cua HR.</p>
                            <button onClick={() => onNavigate?.('hrCandidateReview')} className="mt-4 text-sm text-blue-700 font-semibold hover:text-blue-900">Mo trang</button>
                        </article>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default HrLandingPage
