import { useCallback, useEffect, useRef, useState } from "react"
import { Briefcase, ArrowLeft, ShieldCheck, UserCircle2, ChevronDown, LogOut, FileText, Building2, MapPin, ExternalLink, Globe } from "lucide-react"
import { getPublicCompany, type Company } from "../../features/companies/api/companies"
import { fetchJobs, type Job } from "../../features/jobs/api/jobs"
import { applyToJob, getSavedApplications } from "../../features/jobs/api/applications"
import type { AuthUser } from "../../features/auth/api/auth"
import type { AppPage, UserRole } from "../../shared/routes/appRoutes"

type CompanyDetailsPageProps = {
    onNavigate?: (page: AppPage, options?: { searchParams?: Record<string, string> }) => void
    currentUser?: AuthUser | null
    role?: UserRole | null
    onLogout?: () => void
}

const CompanyDetailsPage = ({ onNavigate, currentUser, role, onLogout }: CompanyDetailsPageProps) => {
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [company, setCompany] = useState<Company | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const profileMenuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('companyId');
        setCompanyId(id);
    }, [])

    const loadData = useCallback(async () => {
        if (!companyId) {
            setError("Công ty không khả dụng")
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            setError(null)

            // fetch company
            const companyData = await getPublicCompany(companyId)
            setCompany(companyData)

            // fetch jobs
            let allJobs = await fetchJobs()
            // case-insensitive fuzzy match since models might be slightly divergent
            const filteredJobs = allJobs.filter(j =>
                j.company && companyData.name && j.company.toLowerCase().includes(companyData.name.toLowerCase())
            )
            setJobs(filteredJobs)

            if (currentUser && role === 'seeker') {
                const apps = await getSavedApplications()
                setAppliedJobs(new Set(apps.map(a => a.job_id)))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu công ty')
        } finally {
            setLoading(false)
        }
    }, [companyId, currentUser, role])

    useEffect(() => {
        if (companyId) {
            void loadData()
        }
    }, [companyId, loadData])

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (!profileMenuRef.current) return
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

    const initials = currentUser
        ? currentUser.full_name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
        : ''

    const roleLabel = role === 'recruiter' ? 'Nhà tuyển dụng' : role === 'seeker' ? 'Ứng viên' : 'Khách'

    const handleApplyJob = async (jobId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (!currentUser || role !== 'seeker') {
            onNavigate?.('login')
            return
        }

        try {
            await applyToJob(jobId)
            setAppliedJobs(prev => new Set(prev).add(jobId))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Không thể ứng tuyển. Vui lòng thử lại.')
        }
    }

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
                            <span className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">Công ty</span>
                            <button onClick={() => onNavigate?.('aiCoach')} className="text-slate-600 hover:text-blue-600 font-medium">AI luyện phỏng vấn</button>
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
                                    <button onClick={() => onNavigate?.('register')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm">Đăng ký</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={() => onNavigate?.("companiesList")}
                        className="inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </button>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">Đang tải...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 px-4 rounded-2xl border border-red-100 bg-red-50 text-red-700">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-1">Không thể tải chi tiết công ty</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    ) : company ? (
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center p-4">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="w-16 h-16 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{company.name}</h1>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                    {company.location && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {company.location}
                                        </div>
                                    )}
                                    {company.website && (
                                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                            <Globe className="w-4 h-4 text-slate-400" />
                                            {company.website.replace(/^https?:\/\//, '')}
                                            <ExternalLink className="w-3 h-3 ml-0.5" />
                                        </a>
                                    )}
                                </div>
                                {company.description && (
                                    <div className="mt-6 prose prose-slate max-w-none text-slate-600 border-t border-slate-100 pt-6">
                                        <p>{company.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">
                    Việc làm đang tuyển dụng
                    {jobs.length > 0 && <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{jobs.length} việc làm</span>}
                </h2>

                {loading ? null : (
                    jobs.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl">
                            <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Briefcase className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hiện chưa có vị trí nào đang tuyển</h3>
                            <p className="text-slate-600 max-w-md mx-auto">Vui lòng quay lại sau cập nhật nhé!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => {
                                const isApplied = appliedJobs.has(job.id)
                                return (
                                    <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-xl hover:border-blue-300 flex flex-col h-full">
                                        <h3 className="font-bold text-slate-900 text-lg line-clamp-2">{job.title}</h3>
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-100">{job.salary}</span>
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium border border-blue-100">{job.employment_type}</span>
                                        </div>
                                        <div className="mt-4 flex items-start gap-2 text-sm text-slate-500 line-clamp-3 flex-1 wrap-break-word">
                                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{job.location}</span>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-100">
                                            {isApplied ? (
                                                <button disabled className="w-full bg-slate-100 text-slate-500 py-2.5 rounded-xl font-semibold flex justify-center items-center gap-2 cursor-not-allowed">
                                                    <ShieldCheck className="w-5 h-5" /> Đã ứng tuyển
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleApplyJob(job.id, e)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                                                >
                                                    Ứng tuyển ngay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}
            </div>
        </section>
    )
}

export default CompanyDetailsPage
