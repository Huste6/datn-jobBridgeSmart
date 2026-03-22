import { Pencil, Trash2, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import { deleteCompanyJob, listCompanyJobs, setSelectedJobId } from '../../features/hr/api/hrRecruiter'

const HrCompanyJobsPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [refreshTick, setRefreshTick] = useState(0)
    const jobs = useMemo(() => listCompanyJobs(), [refreshTick])

    return (
        <HrShell
            title="HR: Trang danh sách job của công ty"
            subtitle="Xem nhanh các tin đăng hiện có và thao tác sang sửa, xoá, xem ứng viên."
            currentPage="hrCompanyJobs"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => { setSelectedJobId(null); onNavigate('hrJobManagement') }} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Tạo job mới</button>
                </div>

                <div className="space-y-3">
                    {jobs.map((job) => (
                        <article key={job.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
                                    <p className="text-sm text-slate-600 mt-1">{job.location} • {job.employmentType} • {job.salaryRange}</p>
                                    <p className="text-xs text-slate-500 mt-2">Cập nhật: {new Date(job.updatedAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full h-fit ${job.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {job.status === 'open' ? 'Đang tuyển' : 'Đã đóng'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                <button onClick={() => { setSelectedJobId(job.id); onNavigate('hrJobManagement') }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 inline-flex items-center gap-2"><Pencil className="w-4 h-4" /> Sửa</button>
                                <button
                                    onClick={() => {
                                        if (!window.confirm('Bạn chắc chắn muốn xoá job này?')) {
                                            return
                                        }
                                        deleteCompanyJob(job.id)
                                        setRefreshTick((prev) => prev + 1)
                                    }}
                                    className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 text-sm hover:bg-rose-50 inline-flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Xoá
                                </button>
                                <button onClick={() => { setSelectedJobId(job.id); onNavigate('hrJobCandidates') }} className="px-3 py-2 rounded-lg border border-blue-300 text-blue-700 text-sm hover:bg-blue-50 inline-flex items-center gap-2"><UsersRound className="w-4 h-4" /> Ứng viên</button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </HrShell>
    )
}

export default HrCompanyJobsPage
