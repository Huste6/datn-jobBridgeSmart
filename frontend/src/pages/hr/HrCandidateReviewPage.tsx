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
import { Brain, FileText, CheckCircle2, AlertCircle, Sparkles, ExternalLink, ArrowLeft } from 'lucide-react'

const stageOptions = [
    { value: 'new', label: 'Mới' },
    { value: 'screening', label: 'Đang screening' },
    { value: 'interview', label: 'Phỏng vấn' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
] as const

interface ParsedNotes {
    summary?: string
    matching_skills?: string[]
    strengths?: string[]
    weaknesses?: string[]
    recommendations?: string[]
}

const parseNotes = (rawNotes: string): ParsedNotes | null => {
    if (!rawNotes) return null
    try {
        const parsed = JSON.parse(rawNotes)
        if (parsed && typeof parsed === 'object') {
            return parsed
        }
    } catch (e) {
        // Not JSON
    }
    return null
}

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

    const parsed = parseNotes(notes)
    const displayNotesText = parsed ? (parsed.summary || '') : notes

    return (
        <HrShell
            title="HR: Trang chi tiết hồ sơ ứng viên và chăm điểm thủ công"
            subtitle="Đánh giá CV theo tiêu chí riêng và cập nhật trạng thái ứng viên."
            currentPage="hrCandidateReview"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            {!candidate ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                    <p className="text-slate-700">Chưa chọn ứng viên để xem chi tiết.</p>
                    <button onClick={() => onNavigate('hrJobCandidates')} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách ứng viên
                    </button>
                </div>
            ) : (
                <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 items-start">
                    
                    {/* LEFT PANEL: CV CỦA ỨNG VIÊN */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col h-[780px]">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{candidate.fullName}</h2>
                                <p className="text-sm text-slate-600 mt-1">{candidate.email} • {candidate.phone}</p>
                                <p className="text-sm font-medium text-blue-600 mt-1">Vị trí ứng tuyển: {job?.title || 'Đang tải vị trí...'}</p>
                            </div>
                            {(candidate as any).cvUrl && (
                                <a 
                                    href={(candidate as any).cvUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Mở CV gốc
                                </a>
                            )}
                        </div>

                        {/* Embed PDF Reader or show Summary fallback */}
                        {(candidate as any).cvUrl ? (
                            <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative flex flex-col">
                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-medium text-slate-600">
                                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500" /> Tài liệu CV</span>
                                    <span>PDF Viewer</span>
                                </div>
                                <iframe 
                                    src={(candidate as any).cvUrl} 
                                    className="w-full flex-1 border-0" 
                                    title={`CV của ${candidate.fullName}`}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 rounded-xl border border-slate-200 p-4 bg-slate-50 overflow-y-auto">
                                <p className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-blue-600" /> Tóm tắt hồ sơ (Chưa có CV file)
                                </p>
                                <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{candidate.summary || 'Không có tóm tắt hồ sơ'}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: KẾT QUẢ PHÂN TÍCH AI & BIỂU MẪU ĐÁNH GIÁ */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" /> Kết quả phân tích của AI
                        </h3>

                        {notes && (parsed || manualScore > 0) ? (
                            <div className="space-y-5">
                                {/* Điểm tương thích */}
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" className="stroke-slate-200 fill-none" strokeWidth="5" />
                                            <circle 
                                                cx="32" 
                                                cy="32" 
                                                r="28" 
                                                className={`fill-none transition-all duration-1000 ${
                                                    manualScore >= 80 ? 'stroke-emerald-500' : manualScore >= 60 ? 'stroke-amber-500' : 'stroke-rose-500'
                                                }`} 
                                                strokeWidth="5" 
                                                strokeDasharray="176" 
                                                strokeDashoffset={176 - (176 * manualScore) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute text-sm font-bold text-slate-800">{manualScore}%</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">Điểm tương thích tổng thể</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Mức độ phù hợp của ứng viên với yêu cầu công việc dựa trên phân tích AI.</p>
                                    </div>
                                </div>

                                {/* AI Evaluation & Feedback */}
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Evaluation & Feedback</h4>
                                    <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {displayNotesText || 'Chưa có nhận xét tổng quan.'}
                                    </div>
                                </div>

                                {/* Rich structured columns if notes is JSON */}
                                {parsed && (
                                    <>
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                            {/* Kỹ năng phù hợp */}
                                            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                                                <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kỹ năng phù hợp
                                                </h5>
                                                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-3">
                                                    {parsed.matching_skills && parsed.matching_skills.length > 0 ? (
                                                        parsed.matching_skills.map((s, idx) => <li key={idx}>{s}</li>)
                                                    ) : (
                                                        <span className="text-slate-400 italic">Không có dữ liệu</span>
                                                    )}
                                                </ul>
                                            </div>

                                            {/* Điểm mạnh */}
                                            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 space-y-2">
                                                <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Điểm mạnh
                                                </h5>
                                                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-3">
                                                    {parsed.strengths && parsed.strengths.length > 0 ? (
                                                        parsed.strengths.map((s, idx) => <li key={idx}>{s}</li>)
                                                    ) : (
                                                        <span className="text-slate-400 italic">Không có dữ liệu</span>
                                                    )}
                                                </ul>
                                            </div>

                                            {/* Điểm cần cải thiện */}
                                            <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3.5 space-y-2">
                                                <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Cần cải thiện
                                                </h5>
                                                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-3">
                                                    {parsed.weaknesses && parsed.weaknesses.length > 0 ? (
                                                        parsed.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)
                                                    ) : (
                                                        <span className="text-slate-400 italic">Không có dữ liệu</span>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Đề xuất cho nhà tuyển dụng */}
                                        <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 space-y-2">
                                            <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Đề xuất cho nhà tuyển dụng</h5>
                                            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4 leading-relaxed">
                                                {parsed.recommendations && parsed.recommendations.length > 0 ? (
                                                    parsed.recommendations.map((r, idx) => <li key={idx}>{r}</li>)
                                                ) : (
                                                    <span className="text-slate-400 italic">Không có đề xuất</span>
                                                )}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                                <Brain className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-medium">Hồ sơ chưa được đánh giá bằng AI</p>
                                <p className="text-xs text-slate-400 mt-1">Nhấp nút "AI đánh giá CV" ở bên dưới để phân tích độ tương thích.</p>
                            </div>
                        )}

                        {/* Consolidated Rating & Action Buttons */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái tuyển dụng</span>
                                    <select 
                                        value={stage} 
                                        onChange={(e) => setStage(e.target.value as any)} 
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                    >
                                        {stageOptions.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 block">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm đánh giá (0-100)</span>
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
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
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
                                            setMessage(`AI đã đánh giá CV thành công!`)
                                        } catch (error) {
                                            setMessage(error instanceof Error ? error.message : 'AI đánh giá thất bại')
                                        } finally {
                                            setIsEvaluatingAI(false)
                                        }
                                    }}
                                    disabled={isEvaluatingAI}
                                    className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 disabled:opacity-60 transition text-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Brain className="w-4 h-4" />
                                    {isEvaluatingAI ? 'Đang AI đánh giá...' : 'AI đánh giá CV'}
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!candidate) return
                                        setMessage('')
                                        try {
                                            const updated = await updateCandidateReview(candidate.id, { stage, manualScore, notes })
                                            if (updated) {
                                                setCandidate(updated)
                                            }
                                            setMessage('Đã cập nhật đánh giá ứng viên thành công!')
                                        } catch (error) {
                                            setMessage(error instanceof Error ? error.message : 'Cập nhật thất bại')
                                        }
                                    }}
                                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition text-sm cursor-pointer"
                                >
                                    Lưu đánh giá
                                </button>
                                
                                <button 
                                    onClick={() => onNavigate('hrJobCandidates')} 
                                    className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition text-sm cursor-pointer"
                                >
                                    Quay lại danh sách
                                </button>
                            </div>

                            {message && (
                                <p className={`text-sm font-medium ${message.includes('thất bại') ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </HrShell>
    )
}

export default HrCandidateReviewPage
