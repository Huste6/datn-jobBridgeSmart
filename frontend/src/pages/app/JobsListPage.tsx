import { useCallback, useEffect, useRef, useState } from "react"
import { Briefcase, MapPin, Wallet, Search, Filter, ArrowLeft, ShieldCheck, UserCircle2, ChevronDown, LogOut, Sparkles, X, FileText } from "lucide-react"
import { fetchJobs, fetchJobsByQuery, type Job } from "../../features/jobs/api/jobs"
import { applyToJob, hasApplied } from "../../features/jobs/api/applications"
import type { AuthUser } from "../../features/auth/api/auth"
import type { AppPage, UserRole } from "../../shared/routes/appRoutes"

type JobsListPageProps = {
    onNavigate?: (page: AppPage) => void
    currentUser?: AuthUser | null
    role?: UserRole | null
    onLogout?: () => void
}

const JobsListPage = ({ onNavigate, currentUser, role, onLogout }: JobsListPageProps) => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [keyword, setKeyword] = useState("")
    const [location, setLocation] = useState("")
    const [salaryBand, setSalaryBand] = useState<'all' | 'under20' | '20to35' | '35to50' | 'over50'>("all")
    const [sortMode, setSortMode] = useState<'newest' | 'title' | 'company'>("newest")
    const [employmentTypes, setEmploymentTypes] = useState<string[]>([])
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [lastAppliedJobId, setLastAppliedJobId] = useState<string | null>(null)
    const hasLoadedRef = useRef(false)
    const hasAutoSearchStartedRef = useRef(false)
    const profileMenuRef = useRef<HTMLDivElement | null>(null)

    const salaryOptions = [
        { value: 'all', label: 'Tất cả mức lương' },
        { value: 'under20', label: 'Dưới 20 triệu' },
        { value: '20to35', label: '20 - 35 triệu' },
        { value: '35to50', label: '35 - 50 triệu' },
        { value: 'over50', label: 'Trên 50 triệu' },
    ] as const

    const employmentOptions = ['Toàn thời gian', 'Bán thời gian', 'Thực tập', 'Remote']

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

    const loadJobs = useCallback(async (force?: boolean) => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchJobs({ force })
            setJobs(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch jobs"
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    const runSearch = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchJobsByQuery({
                q: keyword,
                location,
                salaryBand,
                employmentTypes,
                sort: sortMode,
            })
            setJobs(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch jobs"
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [employmentTypes, keyword, location, salaryBand, sortMode])

    const resetFilters = () => {
        setKeyword("")
        setLocation("")
        setSalaryBand("all")
        setSortMode("newest")
        setEmploymentTypes([])
    }

    const toggleEmploymentType = (value: string) => {
        setEmploymentTypes((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
    }

    const handleApply = (jobId: string) => {
        applyToJob(jobId)
        setLastAppliedJobId(jobId)
    }

    const initials = currentUser
        ? currentUser.full_name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
        : ''

    const roleLabel = role === 'recruiter' ? 'Nhà tuyển dụng' : role === 'seeker' ? 'Ứng viên' : 'Khách'

    useEffect(() => {
        if (hasLoadedRef.current) {
            return
        }
        hasLoadedRef.current = true
        void loadJobs()
    }, [loadJobs])

    useEffect(() => {
        if (!hasLoadedRef.current) {
            return
        }

        if (!hasAutoSearchStartedRef.current) {
            hasAutoSearchStartedRef.current = true
            return
        }

        const timer = window.setTimeout(() => {
            void runSearch()
        }, 350)

        return () => {
            window.clearTimeout(timer)
        }
    }, [keyword, location, salaryBand, employmentTypes, sortMode, runSearch])

    return (
        <section className="bg-slate-50 min-h-screen pb-12 w-full">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <button className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('landing')}>
                            <span className="bg-blue-600 p-2 rounded-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </span>
                            <span className="text-2xl font-bold bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                                JobBridge AI
                            </span>
                        </button>
                        <nav className="hidden md:flex space-x-8">
                            <button onClick={() => onNavigate?.('jobsList')} className="text-slate-600 hover:text-blue-600 font-medium">Tìm việc làm</button>
                            <span className="text-slate-500 font-medium">Công ty</span>
                            <span className="text-slate-500 font-medium">AI Tư vấn</span>
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
                                        <span className="hidden sm:block text-sm text-slate-700 max-w-30 truncate">{currentUser.full_name}</span>
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
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onNavigate?.('login')} className="text-slate-600 hover:text-blue-600 font-medium px-4 py-2">Đăng nhập</button>
                                    <button onClick={() => onNavigate?.('register')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm">Nhà tuyển dụng</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => onNavigate?.("landing")}
                        className="inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
                    </button>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Khám phá việc làm
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Tìm kiếm cơ hội nghề nghiệp tiếp theo của bạn từ hàng ngàn công ty hàng đầu đang tuyển dụng.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
                {/* Search Tool Bar */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-200/60 mb-8">
                    <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_auto]">
                        <div className="relative flex items-center rounded-2xl border border-transparent bg-slate-50 px-4 py-3 transition-all focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                            <Search className="w-5 h-5 shrink-0 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Vị trí ứng tuyển, kỹ năng, công ty..."
                                className="w-full bg-transparent border-none px-3 text-slate-900 placeholder:text-slate-500 focus:ring-0 outline-none"
                            />
                            {keyword.trim() && (
                                <button
                                    onClick={() => setKeyword("")}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                    aria-label="Xóa từ khóa"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="relative flex items-center rounded-2xl border border-transparent bg-slate-50 px-4 py-3 transition-all focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                            <MapPin className="w-5 h-5 shrink-0 text-slate-400" />
                            <input
                                type="text"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="Tất cả địa điểm"
                                className="w-full bg-transparent border-none px-3 text-slate-900 placeholder:text-slate-500 focus:ring-0 outline-none"
                            />
                            {location.trim() && (
                                <button
                                    onClick={() => setLocation("")}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                    aria-label="Xóa địa điểm"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                            <Sparkles className="h-4 w-4" /> Tự động lọc
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter Sidebar */}
                    <div className="w-full lg:w-72 shrink-0 hidden lg:block">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-slate-700" />
                                    <h3 className="font-bold text-slate-900 text-lg">Bộ lọc</h3>
                                </div>
                                <button onClick={resetFilters} className="text-sm font-medium text-blue-600 hover:text-blue-700">Xóa lọc</button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-4">Mức lương</h4>
                                    <div className="space-y-3">
                                        {salaryOptions.map((opt) => (
                                            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input type="radio" name="salary" checked={salaryBand === opt.value} onChange={() => setSalaryBand(opt.value)} className="w-5 h-5 border-2 border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors" />
                                                </div>
                                                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-4">Hình thức làm việc</h4>
                                    <div className="space-y-3">
                                        {employmentOptions.map((opt) => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" checked={employmentTypes.includes(opt)} onChange={() => toggleEmploymentType(opt)} className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" />
                                                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500">Bộ lọc áp dụng tự động sau khi bạn thay đổi lựa chọn.</p>
                            </div>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="grow min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h2 className="text-slate-700 font-medium text-lg">
                                Tìm thấy <span className="font-bold text-slate-900 text-xl mx-1">{jobs.length}</span> việc làm
                            </h2>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                                <span className="text-sm font-medium text-slate-500">Sắp xếp:</span>
                                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as 'newest' | 'title' | 'company')} className="border-none bg-transparent text-slate-900 font-semibold cursor-pointer focus:ring-0 p-0 text-sm outline-none">
                                    <option value="newest">Mới nhất</option>
                                    <option value="title">Theo tiêu đề</option>
                                    <option value="company">Theo công ty</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 p-6">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                                            <div className="grow">
                                                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                                                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-slate-200 rounded w-1/2 mt-4"></div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 flex flex-col items-center justify-center text-center">
                                <span className="text-4xl mb-2">⚠️</span>
                                <h3 className="font-bold text-lg mb-1">Đã có lỗi xảy ra</h3>
                                <p>{error}</p>
                                <button onClick={() => void loadJobs(true)} className="mt-4 px-4 py-2 bg-white text-red-600 font-medium rounded-lg shadow-sm border border-red-100 hover:bg-red-50">Thử lại</button>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy cong viec phù hợp</h3>
                                <p className="text-slate-500 max-w-md mx-auto">Vui lòng thử thay đổi từ khóa tim kiem hoặc điều chỉnh bộ lọc để xem thêm các cơ hội khác.</p>
                                <button onClick={resetFilters} className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {jobs.map((job) => (
                                    <article key={job.id} onClick={() => setSelectedJob(job)} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 hover:border-blue-300 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-5 items-start">
                                                <div className="w-16 h-16 bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold text-slate-400 border border-slate-200 shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                                    {job.company.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight mb-1">{job.title}</h2>
                                                    <p className="text-slate-600 font-medium">{job.company}</p>
                                                </div>
                                            </div>
                                            {job.posted_at && (
                                                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 whitespace-nowrap hidden sm:block">
                                                    {new Date(job.posted_at).toLocaleDateString("vi-VN")}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5 text-sm font-semibold">
                                            <span className="inline-flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                                            </span>
                                            <span className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                <Wallet className="w-4 h-4 text-emerald-500" /> {job.salary}
                                            </span>
                                            <span className="inline-flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <Briefcase className="w-4 h-4 text-slate-400" /> {job.employment_type || "Toàn thời gian"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-5">
                                            {(job.tags || []).slice(0, 5).map((tag, idx) => (
                                                <span key={idx} className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                            {(job.tags || []).length > 5 && (
                                                <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                                                    +{job.tags.length - 5}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 sm:flex">
                                            <span className="text-blue-600 font-semibold text-sm">Nhấn để xem chi tiết →</span>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        handleApply(job.id)
                                                    }}
                                                    disabled={hasApplied(job.id)}
                                                    className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all ${hasApplied(job.id) ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                >
                                                    {hasApplied(job.id) ? 'Đã ứng tuyển' : 'Ứng tuyển nhanh'}
                                                </button>
                                                <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all">
                                                    Lưu tin
                                                </button>
                                            </div>
                                        </div>

                                        {lastAppliedJobId === job.id && (
                                            <p className="mt-3 text-sm font-medium text-green-700">Đã lưu vào danh sách CV đã ứng tuyển.</p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4" onClick={() => setSelectedJob(null)}>
                    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-blue-600 font-semibold mb-1">Chi tiết công việc</p>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h3>
                                <p className="text-slate-600">{selectedJob.company} • {selectedJob.location}</p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Đóng</button>
                        </div>

                        <div className="px-6 py-5 space-y-6">
                            <div className="grid sm:grid-cols-3 gap-3 text-sm">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-slate-500">Mức lương</p>
                                    <p className="font-semibold text-slate-900">{selectedJob.salary}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-slate-500">Hình thức</p>
                                    <p className="font-semibold text-slate-900">{selectedJob.employment_type || "Toàn thời gian"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-slate-500">Cấp độ</p>
                                    <p className="font-semibold text-slate-900">{selectedJob.experience_level || "Không yêu cầu"}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Mô tả công việc</h4>
                                <p className="text-slate-700 leading-relaxed">{selectedJob.description || "Đang cập nhật mô tả công việc."}</p>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Trách nhiệm chính</h4>
                                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                                    {(selectedJob.responsibilities || []).length > 0 ? (
                                        (selectedJob.responsibilities || []).map((item, index) => (
                                            <li key={`responsibility-${index}`}>{item}</li>
                                        ))
                                    ) : (
                                        <li>Nhà tuyển dụng chưa cập nhật mục này.</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Yêu cầu ứng viên</h4>
                                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                                    {(selectedJob.requirements || []).length > 0 ? (
                                        (selectedJob.requirements || []).map((item, index) => (
                                            <li key={`requirement-${index}`}>{item}</li>
                                        ))
                                    ) : (
                                        <li>Nhà tuyển dụng chưa cập nhật mục này.</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Quyền lợi</h4>
                                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                                    {(selectedJob.benefits || []).length > 0 ? (
                                        (selectedJob.benefits || []).map((item, index) => (
                                            <li key={`benefit-${index}`}>{item}</li>
                                        ))
                                    ) : (
                                        <li>Nhà tuyển dụng chưa cập nhật mục này.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default JobsListPage

