import { Briefcase, Search } from 'lucide-react'
import type { AppPage, UserRole } from '../../shared/routes/appRoutes'

type Props = {
    onNavigate: (page: AppPage) => void
    onSelectRole: (role: UserRole) => void
}

const RoleSelectPage = ({ onNavigate, onSelectRole }: Props) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-10">
                <p className="text-sm font-semibold text-blue-600 mb-2">Onboarding</p>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Bạn đang sử dụng JobBridge với vai trò nào?</h1>
                <p className="text-slate-600 mb-8">Chọn vai trò để hệ thống cá nhân hóa sidebar và chức năng phù hợp.</p>

                <div className="grid md:grid-cols-2 gap-5">
                    <button
                        onClick={() => onSelectRole('seeker')}
                        className="text-left p-6 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                            <Search className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Tôi tìm việc</h2>
                        <p className="text-slate-600">Dành cho ứng viên tìm kiếm việc làm, quản lý CV và theo dõi ứng tuyển.</p>
                    </button>

                    <button
                        onClick={() => onSelectRole('recruiter')}
                        className="text-left p-6 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Tôi tuyển dụng</h2>
                        <p className="text-slate-600">Dành cho nhà tuyển dụng đăng tin, tìm ứng viên và quản lý pipeline tuyển dụng.</p>
                    </button>
                </div>

                <button
                    onClick={() => onNavigate('landing')}
                    className="mt-8 text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                    Để sau
                </button>
            </div>
        </div>
    )
}

export default RoleSelectPage
