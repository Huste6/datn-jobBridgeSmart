import { useMemo, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import { getCompanyProfile, saveCompanyProfile } from '../../features/hr/api/hrRecruiter'

const HrCompanyCreatePage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const defaultProfile = useMemo(() => getCompanyProfile(), [])
    const [form, setForm] = useState({
        name: defaultProfile?.name ?? '',
        taxCode: defaultProfile?.taxCode ?? '',
        website: defaultProfile?.website ?? '',
        industry: defaultProfile?.industry ?? '',
        size: defaultProfile?.size ?? '',
        location: defaultProfile?.location ?? '',
        description: defaultProfile?.description ?? '',
    })
    const [message, setMessage] = useState('')

    return (
        <HrShell
            title="HR: Trang tạo company"
            subtitle="Tạo mới hoặc cập nhật thông tin công ty để sử dụng trong toàn bộ hệ thống tuyển dụng."
            currentPage="hrCompanyCreate"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Tên công ty</span>
                        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Mã số thuế</span>
                        <input value={form.taxCode} onChange={(e) => setForm((prev) => ({ ...prev, taxCode: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Website</span>
                        <input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Lĩnh vực</span>
                        <input value={form.industry} onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Quy mô</span>
                        <input value={form.size} onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium text-slate-700">Địa điểm</span>
                        <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>
                </div>

                <label className="space-y-1 block">
                    <span className="text-sm font-medium text-slate-700">Mô tả công ty</span>
                    <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={5} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </label>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            saveCompanyProfile(form)
                            setMessage('Đã lưu thông tin company thành công')
                        }}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Lưu company
                    </button>
                    <button onClick={() => onNavigate('hrCompanyProfile')} className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100">
                        Xem hồ sơ company
                    </button>
                </div>

                {message && <p className="text-sm text-emerald-700">{message}</p>}
            </div>
        </HrShell>
    )
}

export default HrCompanyCreatePage
