import { useEffect, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import {
    createCompanyProfile,
    fetchCompanyProfile,
    updateCompanyProfile,
} from '../../features/hr/api/hrRecruiter'

const HrCompanyCreatePage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [form, setForm] = useState({
        name: '',
        taxCode: '',
        website: '',
        industry: '',
        size: '',
        location: '',
        description: '',
    })
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            try {
                const existing = await fetchCompanyProfile()
                if (!isMounted) {
                    return
                }

                if (existing) {
                    setForm(existing)
                    setIsEditing(true)
                }
            } catch (error) {
                if (isMounted) {
                    setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu công ty.')
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        load()
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <HrShell
            title="HR: Trang tạo company"
            subtitle="Nhập thông tin công ty. Khi bấm tạo, dữ liệu sẽ hiển thị ngay ở trang hồ sơ công ty."
            currentPage="hrCompanyCreate"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                {isLoading && <p className="text-sm text-slate-600">Đang tải dữ liệu công ty...</p>}

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
                        onClick={async () => {
                            if (!form.name.trim() || !form.taxCode.trim() || !form.location.trim()) {
                                setMessage('Vui lòng nhập ít nhất: tên công ty, mã số thuế và địa điểm.')
                                return
                            }

                            setIsSaving(true)
                            setMessage('')
                            try {
                                if (isEditing) {
                                    await updateCompanyProfile(form)
                                    setMessage('Đã cập nhật công ty thành công.')
                                } else {
                                    await createCompanyProfile(form)
                                    setMessage('Đã tạo công ty thành công.')
                                    setIsEditing(true)
                                }
                                onNavigate('hrCompanyProfile')
                            } catch (error) {
                                setMessage(error instanceof Error ? error.message : 'Không thể lưu công ty.')
                            } finally {
                                setIsSaving(false)
                            }
                        }}
                        disabled={isLoading || isSaving}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Đang lưu...' : isEditing ? 'Cập nhật công ty' : 'Tạo công ty'}
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
