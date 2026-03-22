import { useEffect, useMemo, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import {
    createCompanyJob,
    deleteCompanyJob,
    getCompanyJobById,
    getSelectedJobId,
    listCompanyJobs,
    setSelectedJobId,
    updateCompanyJob,
} from '../../features/hr/api/hrRecruiter'

const emptyForm = {
    title: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: '',
    description: '',
    status: 'open' as 'open' | 'closed',
}

const HrJobManagementPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [refreshTick, setRefreshTick] = useState(0)
    const [editingJobId, setEditingJobId] = useState<string | null>(getSelectedJobId())
    const [form, setForm] = useState(emptyForm)
    const [message, setMessage] = useState('')

    const jobs = useMemo(() => listCompanyJobs(), [refreshTick])

    useEffect(() => {
        if (!editingJobId) {
            setForm(emptyForm)
            return
        }

        const job = getCompanyJobById(editingJobId)
        if (!job) {
            setForm(emptyForm)
            setEditingJobId(null)
            return
        }

        setForm({
            title: job.title,
            location: job.location,
            employmentType: job.employmentType,
            salaryRange: job.salaryRange,
            description: job.description,
            status: job.status,
        })
    }, [editingJobId, refreshTick])

    const resetCreateMode = () => {
        setSelectedJobId(null)
        setEditingJobId(null)
        setForm(emptyForm)
    }

    return (
        <HrShell
            title="HR: Trang tạo hoặc sửa hoặc xoá job"
            subtitle="Quản lý đầy đủ vòng đời job posting trên một màn hình."
            currentPage="hrJobManagement"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="grid xl:grid-cols-[1.15fr_.85fr] gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-semibold text-slate-900">{editingJobId ? 'Cập nhật job' : 'Tạo job mới'}</h2>
                        {editingJobId && <button onClick={resetCreateMode} className="text-sm text-blue-700 hover:text-blue-900">Chuyển sang tạo mới</button>}
                    </div>

                    <label className="space-y-1 block">
                        <span className="text-sm font-medium text-slate-700">Tiêu đề job</span>
                        <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Địa điểm</span>
                            <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                        </label>
                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Mức lương</span>
                            <input value={form.salaryRange} onChange={(e) => setForm((prev) => ({ ...prev, salaryRange: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                        </label>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Loại hình</span>
                            <select value={form.employmentType} onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="remote">Remote</option>
                                <option value="internship">Internship</option>
                            </select>
                        </label>
                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Trạng thái</span>
                            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'open' | 'closed' }))} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                                <option value="open">Đang tuyển</option>
                                <option value="closed">Đã đóng</option>
                            </select>
                        </label>
                    </div>

                    <label className="space-y-1 block">
                        <span className="text-sm font-medium text-slate-700">Mô tả công việc</span>
                        <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={6} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </label>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                if (!form.title.trim()) {
                                    setMessage('Vui lòng nhập tiêu đề job')
                                    return
                                }

                                if (editingJobId) {
                                    const updated = updateCompanyJob(editingJobId, form)
                                    setMessage(updated ? 'Đã cập nhật job' : 'Không tìm thấy job để cập nhật')
                                } else {
                                    createCompanyJob(form)
                                    setMessage('Đã tạo job mới')
                                    resetCreateMode()
                                }

                                setRefreshTick((prev) => prev + 1)
                            }}
                            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {editingJobId ? 'Lưu thay đổi' : 'Tạo job'}
                        </button>

                        {editingJobId && (
                            <button
                                onClick={() => {
                                    if (!window.confirm('Bạn chắc chắn muốn xoá job này?')) {
                                        return
                                    }
                                    deleteCompanyJob(editingJobId)
                                    setMessage('Đã xoá job')
                                    resetCreateMode()
                                    setRefreshTick((prev) => prev + 1)
                                }}
                                className="px-5 py-2.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                            >
                                Xoá job
                            </button>
                        )}
                    </div>

                    {message && <p className="text-sm text-slate-700">{message}</p>}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h2 className="font-semibold text-slate-900 mb-3">Danh sách job hiện tại</h2>
                    <div className="space-y-2 max-h-120 overflow-auto pr-1">
                        {jobs.map((job) => (
                            <button
                                key={job.id}
                                onClick={() => {
                                    setSelectedJobId(job.id)
                                    setEditingJobId(job.id)
                                }}
                                className={`w-full text-left rounded-xl border p-3 transition-colors ${editingJobId === job.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <p className="font-medium text-slate-900">{job.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{job.location} • {job.salaryRange}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </HrShell>
    )
}

export default HrJobManagementPage
