import { useEffect, useMemo, useRef, useState } from 'react'
import {
    ArrowLeft,
    Bot,
    Briefcase,
    ChevronDown,
    FileText,
    LogOut,
    Paperclip,
    Send,
    ShieldCheck,
    Sparkles,
    UserCircle2,
} from 'lucide-react'
import type { AuthUser } from '../../features/auth/api/auth'
import { uploadCV } from '../../features/auth/api/auth'
import { coachInterview } from '../../features/jobs/api/aiCoach'
import { getSavedApplications } from '../../features/jobs/api/applications'
import { fetchJobs } from '../../features/jobs/api/jobs'
import type { AppPage, UserRole } from '../../shared/routes/appRoutes'

type Props = {
    onNavigate?: (page: AppPage) => void
    currentUser?: AuthUser | null
    role?: UserRole | null
    onLogout?: () => void
}

type AppliedJobOption = {
    id: string
    title: string
    company: string
    location: string
}

type ChatMessage = {
    id: string
    role: 'assistant' | 'user'
    content: string
    time: string
}

function nowLabel(): string {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const defaultAssistantMessage: ChatMessage = {
    id: 'm1',
    role: 'assistant',
    content: 'Chào bạn! Mình là AI Interview Coach. Hãy chọn job đã ứng tuyển và tải CV để bắt đầu luyện phỏng vấn.',
    time: nowLabel(),
}

const AiInterviewCoachPage = ({ onNavigate, currentUser, role, onLogout }: Props) => {
    const [messages, setMessages] = useState<ChatMessage[]>([defaultAssistantMessage])
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [appliedJobs, setAppliedJobs] = useState<AppliedJobOption[]>([])
    const [selectedJobId, setSelectedJobId] = useState('')
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)
    const [cvFileName, setCvFileName] = useState('')
    const [cvUrl, setCvUrl] = useState('')
    const [cvStatus, setCvStatus] = useState<'idle' | 'uploading' | 'ready' | 'error'>('idle')
    const [cvError, setCvError] = useState('')
    const profileMenuRef = useRef<HTMLDivElement | null>(null)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const chatEndRef = useRef<HTMLDivElement | null>(null)

    const selectedJob = useMemo(
        () => appliedJobs.find((item) => item.id === selectedJobId) ?? null,
        [appliedJobs, selectedJobId],
    )

    const initials = (currentUser?.full_name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')

    const roleLabel = role === 'recruiter' ? 'Nhà tuyển dụng' : role === 'seeker' ? 'Ứng viên' : 'Khách'

    useEffect(() => {
        let isMounted = true
        const loadAppliedJobs = async () => {
            setIsLoadingJobs(true)
            try {
                const [applications, jobs] = await Promise.all([getSavedApplications(), fetchJobs()])
                const appliedMap = new Set(applications.map((app) => app.job_id))
                const options = jobs
                    .filter((job) => appliedMap.has(job.id))
                    .map((job): AppliedJobOption => ({
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                    }))

                if (!isMounted) return
                setAppliedJobs(options)
                if (options[0]) {
                    setSelectedJobId((prev) => (prev && options.some((x) => x.id === prev) ? prev : options[0].id))
                }
            } finally {
                if (isMounted) {
                    setIsLoadingJobs(false)
                }
            }
        }

        void loadAppliedJobs()
        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        const existingCV = currentUser?.cv_url?.trim() ?? ''
        if (!existingCV) {
            return
        }

        setCvUrl(existingCV)
        const guessedName = existingCV.split('/').pop()?.split('?')[0] ?? ''
        setCvStatus('ready')
        if (!cvFileName) {
            setCvFileName(guessedName || 'cv-da-upload')
        }
    }, [currentUser?.cv_url, cvFileName])

    useEffect(() => {
        setMessages([defaultAssistantMessage])
    }, [selectedJobId])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (!profileMenuRef.current) {
                return
            }
            const target = event.target as Node
            if (!profileMenuRef.current.contains(target)) {
                setIsProfileMenuOpen(false)
            }
        }

        window.addEventListener('mousedown', onMouseDown)
        return () => {
            window.removeEventListener('mousedown', onMouseDown)
        }
    }, [])

    const handleSelectCv = async (file: File | null) => {
        if (!file) return
        setCvError('')
        setCvFileName(file.name)
        setCvStatus('uploading')

        try {
            const updatedUser = await uploadCV(file)
            const uploadedCV = updatedUser.cv_url?.trim() ?? ''
            if (uploadedCV) {
                setCvUrl(uploadedCV)
            }
            setCvStatus('ready')
        } catch (error) {
            setCvStatus('error')
            setCvError(error instanceof Error ? error.message : 'Upload CV that bai')
        }
    }

    const handleSend = async () => {
        const trimmed = input.trim()
        if (!trimmed || isSending) {
            return
        }

        if (!selectedJobId) {
            const assistantMessage: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: 'Bạn hãy chọn một job đã ứng tuyển trước khi chat để mình tư vấn sát với vị trí đó.',
                time: nowLabel(),
            }
            setMessages((prev) => [...prev, assistantMessage])
            return
        }

        const userMessage: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: trimmed,
            time: nowLabel(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsSending(true)

        try {
            const aiResponse = await coachInterview({
                jobId: selectedJobId,
                message: trimmed,
                history: [],
            })

            const assistantMessage: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: aiResponse.reply,
                time: nowLabel(),
            }
            setMessages((prev) => [...prev, assistantMessage])

            if (aiResponse.cv_ready) {
                setCvStatus('ready')
                if (aiResponse.cv_url) {
                    setCvUrl(aiResponse.cv_url)
                }
                if (!cvFileName && aiResponse.cv_url) {
                    const guessedName = aiResponse.cv_url.split('/').pop()?.split('?')[0] ?? 'cv-da-upload'
                    setCvFileName(guessedName)
                }
            }
        } catch (error) {
            const assistantMessage: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: `Mình chưa gọi được AI backend: ${error instanceof Error ? error.message : 'unknown error'}`,
                time: nowLabel(),
            }
            setMessages((prev) => [...prev, assistantMessage])
        } finally {
            setIsSending(false)
        }
    }

    return (
        <section className="bg-slate-50 min-h-screen pb-8">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <button className="flex items-center gap-2" onClick={() => onNavigate?.('landing')}>
                            <span className="bg-blue-600 p-2 rounded-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </span>
                            <span className="text-2xl font-bold bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                                JobBridge AI
                            </span>
                        </button>

                        <nav className="hidden md:flex space-x-8">
                            <button onClick={() => onNavigate?.('jobsList')} className="text-slate-600 hover:text-blue-600 font-medium">Tìm việc làm</button>
                            <button onClick={() => onNavigate?.('companiesList')} className="text-slate-600 hover:text-blue-600 font-medium">Công ty</button>
                            <button onClick={() => onNavigate?.('aiCoach')} className="text-blue-700 font-semibold">AI luyện phỏng vấn</button>
                        </nav>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                                <ShieldCheck className="w-4 h-4" /> {roleLabel}
                            </span>

                            {currentUser ? (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                                    >
                                        <span className="w-8 h-8 shrink-0 overflow-hidden rounded-full bg-blue-600 text-white text-xs font-semibold grid place-items-center">
                                            {currentUser.avatar_url ? (
                                                <img src={currentUser.avatar_url} alt="Avatar" className="block w-full h-full rounded-full object-cover object-center" />
                                            ) : (
                                                initials || 'U'
                                            )}
                                        </span>
                                        <span className="hidden sm:block text-sm text-slate-700 max-w-35 truncate">{currentUser.full_name}</span>
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    </button>

                                    {isProfileMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-50">
                                            <div className="px-3 py-2 border-b border-slate-100">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.full_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false)
                                                    onNavigate?.('appProfile')
                                                }}
                                                className="w-full mt-1 px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                                            >
                                                <UserCircle2 className="w-4 h-4" /> Trang cá nhân
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false)
                                                    onNavigate?.('applications')
                                                }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" /> CV đã ứng tuyển
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false)
                                                    onLogout?.()
                                                }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <button
                    onClick={() => onNavigate?.('landing')}
                    className="inline-flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay về trang chủ
                </button>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-slate-900 mb-3">Ngữ cảnh luyện phỏng vấn</h2>

                            <label className="block mb-3">
                                <span className="text-xs font-medium text-slate-600">Chọn job đã ứng tuyển</span>
                                <select
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    disabled={isLoadingJobs || appliedJobs.length === 0}
                                >
                                    {isLoadingJobs && <option>Đang tải...</option>}
                                    {!isLoadingJobs && appliedJobs.length === 0 && <option value="">Chưa có job đã ứng tuyển</option>}
                                    {appliedJobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title} - {job.company}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                {selectedJob
                                    ? `${selectedJob.title} | ${selectedJob.company} | ${selectedJob.location}`
                                    : 'Chọn 1 job để AI đưa ra bộ câu hỏi sát với vị trí bạn đã ứng tuyển.'}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h2 className="text-sm font-semibold text-slate-900 mb-3">Thêm CV ứng viên</h2>
                            {cvUrl ? (
                                <a
                                    href={cvUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    <FileText className="w-4 h-4" /> Xem CV hiện tại
                                </a>
                            ) : null}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null
                                    void handleSelectCv(file)
                                }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 ${cvUrl ? 'mt-3' : ''}`}
                            >
                                <Paperclip className="w-4 h-4" /> {cvUrl ? 'Tải CV mới' : 'Tải CV'}
                            </button>

                            <p className="mt-3 text-xs text-slate-600">
                                {cvFileName ? `File: ${cvFileName}` : 'Chưa tải CV'}
                            </p>
                            <p className="mt-1 text-xs">
                                {cvStatus === 'uploading' && <span className="text-blue-600">Đang upload CV...</span>}
                                {cvStatus === 'ready' && <span className="text-emerald-600">CV đã sẵn sàng (AI sẽ tự dùng CV đã lưu)</span>}
                                {cvStatus === 'error' && <span className="text-rose-600">{cvError || 'Upload thất bại'}</span>}
                                {cvStatus === 'idle' && <span className="text-slate-500">Nếu bạn đã upload CV trước đó thì AI sẽ tự lấy, không cần upload lại.</span>}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
                            <p className="font-semibold mb-2 inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Gợi ý sử dụng</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Hỏi AI về câu hỏi behavioral và technical.</li>
                                <li>Yêu cầu AI chấm điểm câu trả lời theo thang 10.</li>
                                <li>Nhờ AI tạo mock interview 15 phút theo job đã chọn.</li>
                            </ul>
                        </div>
                    </aside>

                    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-[72vh]">
                        <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">AI Interview Coach</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                        }`}>
                                        <p>{message.content}</p>
                                        <p className={`mt-1 text-[11px] ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                                            {message.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="border-t border-slate-200 p-3">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi AI về cách trả lời phỏng vấn, mock interview, review câu trả lời..."
                                    className="flex-1 min-h-13 max-h-40 rounded-xl border border-slate-300 px-3 py-2 text-sm resize-y"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            void handleSend()
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => void handleSend()}
                                    disabled={isSending || !input.trim()}
                                    className="h-13 px-4 rounded-xl bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2 hover:bg-blue-700"
                                >
                                    <Send className="w-4 h-4" /> Gửi
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Shift + Enter để xuống dòng, Enter để gửi.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AiInterviewCoachPage
