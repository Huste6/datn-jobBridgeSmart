import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock3, FileCheck2, Search, ShieldAlert } from 'lucide-react'
import {
    getSavedApplications,
    type ApplicationStatus,
    type SavedApplication,
} from '../../features/jobs/api/applications'
import { fetchJobs, type Job } from '../../features/jobs/api/jobs'
import type { AppPage } from '../../shared/routes/appRoutes'

type EnrichedApplication = SavedApplication & {
    job: Job | null
}

const statusText: Record<ApplicationStatus, string> = {
    submitted: 'Đã nộp',
    reviewing: 'Đang xem xét',
    interview: 'Phỏng vấn',
    offered: 'Đã nhận offer',
    rejected: 'Từ chối',
}

const statusBadgeClass: Record<ApplicationStatus, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-amber-100 text-amber-700',
    interview: 'bg-violet-100 text-violet-700',
    offered: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
}

const CandidateApplicationsPage = ({ onNavigate }: { onNavigate?: (page: AppPage) => void }) => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [applications, setApplications] = useState<SavedApplication[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const jobData = await fetchJobs()
                setJobs(jobData)
                setApplications(await getSavedApplications())
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [])

    const rows = useMemo<EnrichedApplication[]>(() => {
        return applications.map((application) => ({
            ...application,
            job: jobs.find((job) => job.id === application.job_id) ?? null,
        }))
    }, [applications, jobs])

    const stats = useMemo(() => {
        const total = rows.length
        const active = rows.filter((item) => item.status === 'submitted' || item.status === 'reviewing' || item.status === 'interview').length
        const success = rows.filter((item) => item.status === 'offered').length
        const closed = rows.filter((item) => item.status === 'rejected').length
        return { total, active, success, closed }
    }, [rows])

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <button
                    onClick={() => onNavigate?.('landing')}
                    className="inline-flex items-center gap-2 mb-5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay về trang chủ
                </button>
                <h1 className="text-3xl font-bold text-slate-900">CV đã ứng tuyển và trạng thái công việc</h1>
                <p className="mt-2 text-slate-600">Theo dõi tiến trình từng đơn ứng tuyển để chủ động chuẩn bị hồ sơ và phỏng vấn.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Tổng đơn</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Đang xử lý</p>
                    <p className="mt-2 text-2xl font-bold text-blue-700">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Nhận offer</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.success}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Kết thúc</p>
                    <p className="mt-2 text-2xl font-bold text-rose-700">{stats.closed}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-semibold text-slate-900">Danh sách ứng tuyển</h2>
                </div>

                {loading && <div className="px-5 py-8 text-slate-600">Đang tải dữ liệu ứng tuyển...</div>}

                {!loading && rows.length === 0 && (
                    <div className="px-5 py-12 text-center text-slate-600">
                        <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                        Chưa có đơn ứng tuyển nào. Hãy vào mục Việc làm để ứng tuyển.
                    </div>
                )}

                {!loading && rows.length > 0 && (
                    <div className="divide-y divide-slate-100">
                        {rows.map((item) => (
                            <article key={item.job_id} className="px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{item.job?.title ?? 'Công việc không còn hiển thị'}</h3>
                                        <p className="text-sm text-slate-600">{item.job?.company ?? 'N/A'} • {item.job?.location ?? 'N/A'}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass[item.status]}`}>
                                        {statusText[item.status]}
                                    </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        Ứng tuyển: {new Date(item.applied_at).toLocaleString('vi-VN')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                        <FileCheck2 className="h-3.5 w-3.5" />
                                        Cập nhật: {new Date(item.updated_at).toLocaleString('vi-VN')}
                                    </span>
                                    {item.status === 'rejected' && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            Gợi ý: điều chỉnh CV và tiếp tục ứng tuyển
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default CandidateApplicationsPage
