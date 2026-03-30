import { useEffect, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import {
    evaluateCandidateWithAI,
    getCandidateById,
    getSelectedCandidateId,
    getCompanyJobById,
    type CompanyJob,
    type JobCandidate,
    updateCandidateReview,
} from '../../features/hr/api/hrRecruiter'

const stageOptions = [
    { value: 'new', label: 'Mới' },
    { value: 'screening', label: 'Đang screening' },
    { value: 'interview', label: 'Phỏng vấn' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
] as const

const HrCandidateReviewPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [candidateId] = useState(getSelectedCandidateId())
    const [candidate, setCandidate] = useState<JobCandidate | null>(null)

    useEffect(() => {
        if (!candidateId) return
        let isMounted = true
        getCandidateById(candidateId)
            .then(data => { if (isMounted) setCandidate(data) })
            .catch(console.error)
        return () => { isMounted = false }
    }, [candidateId])

    const [stage, setStage] = useState<'new' | 'screening' | 'interview' | 'offer' | 'rejected'>('new')
    const [manualScore, setManualScore] = useState(70)
    const [notes, setNotes] = useState('')
    const [message, setMessage] = useState('')
    const [isEvaluatingAI, setIsEvaluatingAI] = useState(false)
    const [job, setJob] = useState<CompanyJob | null>(null)

    useEffect(() => {
        if (!candidate) {
            return
        }

        setStage(candidate.stage)
        setManualScore(candidate.manualScore)
        setNotes(candidate.notes)
    }, [candidate])

    useEffect(() => {
        if (!candidate) {
            setJob(null)
            return
        }

        getCompanyJobById(candidate.jobId)
            .then((data) => setJob(data))
            .catch(() => setJob(null))
    }, [candidate])

    return (
        <HrShell
            title="HR: Trang chi tiết hồ sơ ứng viên và chấm điểm thủ công"
            subtitle="Đánh giá CV theo tiêu chí riêng và cập nhật trạng thái ứng viên."
            currentPage="hrCandidateReview"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            {!candidate ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                    <p className="text-slate-700">Chưa chọn ứng viên để xem chi tiết.</p>
                    <button onClick={() => onNavigate('hrJobCandidates')} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
                        Quay lại danh sách ứng viên
                    </button>
                </div>
            ) : (
                <div className="grid xl:grid-cols-[1.1fr_.9fr] gap-5">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{candidate.fullName}</h2>
                            <p className="text-sm text-slate-600 mt-1">{candidate.email} • {candidate.phone}</p>
                            <p className="text-sm text-slate-600 mt-1">Vị trí ứng tuyển: {job?.title || 'Không xác định'}</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="font-semibold text-slate-900 mb-2">Tóm tắt hồ sơ</p>
                            <p className="text-slate-700">{candidate.summary || 'Không có tóm tắt'}</p>
                            {/* <p className="text-sm text-slate-600 mt-3">Kỹ năng: {(candidate.skills || []).join(', ')}</p>
                            <p className="text-sm text-slate-600">Số năm kinh nghiệm: {candidate.yearsOfExperience}</p> */}
                            {/* Removed skills and years of experience as these might not come strictly from user model */}
                        </div>

                        {(candidate as any).cvUrl && (
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="font-semibold text-slate-900 mb-2">CV Ứng viên</p>
                                <a href={(candidate as any).cvUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    Mở hồ sơ PDF
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Trạng thái</span>
                            <select value={stage} onChange={(e) => setStage(e.target.value as 'new' | 'screening' | 'interview' | 'offer' | 'rejected')} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                                {stageOptions.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Điểm thủ công (0-100)</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={manualScore}
                                onChange={(e) => {
                                    const next = Number(e.target.value)
                                    if (Number.isNaN(next)) {
                                        setManualScore(0)
                                        return
                                    }
                                    setManualScore(Math.max(0, Math.min(100, next)))
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                            />
                        </label>

                        <label className="space-y-1 block">
                            <span className="text-sm font-medium text-slate-700">Nhận xét HR</span>
                            <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={async () => {
                                    if (!candidate) return
                                    setIsEvaluatingAI(true)
                                    setMessage('')
                                    try {
                                        const result = await evaluateCandidateWithAI(
                                            candidate.id,
                                            'Hãy đánh giá cv của từng ứng viên dựa trên cv và jd'
                                        )
                                        setManualScore(result.score)
                                        setNotes(result.notes)
                                        setMessage(`AI đã đánh giá CV (điểm: ${result.score}, model: ${result.model})`)
                                    } catch (error) {
                                        setMessage(error instanceof Error ? error.message : 'AI đánh giá thất bại')
                                    } finally {
                                        setIsEvaluatingAI(false)
                                    }
                                }}
                                disabled={isEvaluatingAI}
                                className="px-5 py-2.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                            >
                                {isEvaluatingAI ? 'Đang AI đánh giá...' : 'AI đánh giá CV'}
                            </button>

                            <button
                                onClick={async () => {
                                    if (!candidate) return
                                    const updated = await updateCandidateReview(candidate.id, { stage, manualScore, notes })
                                    setMessage(updated ? 'Đã cập nhật đánh giá ứng viên' : 'Cập nhật thất bại')
                                }}
                                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Lưu đánh giá
                            </button>
                            <button onClick={() => onNavigate('hrJobCandidates')} className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100">
                                Quay lại danh sách
                            </button>
                        </div>

                        {message && <p className="text-sm text-emerald-700">{message}</p>}
                    </div>
                </div>
            )}
        </HrShell>
    )
}

export default HrCandidateReviewPage
