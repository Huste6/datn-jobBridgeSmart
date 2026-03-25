import { useEffect, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import {
    getSelectedJobId,
    listCompanyJobs,
    listJobCandidates,
    setSelectedCandidateId,
    setSelectedJobId,
} from '../../features/hr/api/hrRecruiter'

const HrJobCandidatesPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [jobs, setJobs] = useState<Array<Awaited<ReturnType<typeof listCompanyJobs>>[number]>>([])
    const [selectedJobId, setSelectedJobIdState] = useState<string>(getSelectedJobId() ?? '')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const data = await listCompanyJobs()
                setJobs(data)

                if (!selectedJobId && data[0]?.id) {
                    setSelectedJobIdState(data[0].id)
                    setSelectedJobId(data[0].id)
                }
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Không thể tải danh sách job.')
            }
        }

        loadJobs()
    }, [selectedJobId])

    const [candidates, setCandidates] = useState<Array<Awaited<ReturnType<typeof listJobCandidates>>[number]>>([])
    
    useEffect(() => {
        let isMounted = true
        if (!selectedJobId) {
            setCandidates([])
            return
        }

        listJobCandidates(selectedJobId)
            .then((data) => {
                if (isMounted) setCandidates(data)
            })
            .catch(console.error)

        return () => { isMounted = false }
    }, [selectedJobId])

    return (
        <HrShell
            title="HR: Trang danh sách ứng viên cho từng job"
            subtitle="Lọc ứng viên theo vị trí đang tuyển và mở chi tiết để đánh giá."
            currentPage="hrJobCandidates"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                {message && <p className="text-sm text-rose-700">{message}</p>}

                <label className="space-y-1 block max-w-sm">
                    <span className="text-sm font-medium text-slate-700">Chọn job</span>
                    <select
                        value={selectedJobId}
                        onChange={(e) => {
                            setSelectedJobIdState(e.target.value)
                            setSelectedJobId(e.target.value)
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                        {jobs.map((job) => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </label>

                <div className="space-y-3">
                    {candidates.length === 0 && (
                        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">Chưa có ứng viên cho job này.</div>
                    )}

                    {candidates.map((candidate) => (
                        <article key={candidate.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900">{candidate.fullName}</h3>
                                    <p className="text-sm text-slate-600">{candidate.email} • {candidate.phone}</p>
                                    <p className="text-sm text-slate-600 mt-2">Kinh nghiệm: {candidate.yearsOfExperience} năm</p>
                                    <p className="text-sm text-slate-600">Kỹ năng: {candidate.skills.join(', ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Điểm thủ công</p>
                                    <p className="text-2xl font-bold text-slate-900">{candidate.manualScore}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedCandidateId(candidate.id)
                                        onNavigate('hrCandidateReview')
                                    }}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Xem chi tiết và chấm điểm
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </HrShell>
    )
}

export default HrJobCandidatesPage
