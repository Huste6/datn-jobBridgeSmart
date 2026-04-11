import { useCallback, useEffect, useRef, useState } from "react"
import { Briefcase, Search, ArrowLeft, ShieldCheck, UserCircle2, ChevronDown, LogOut, FileText, Building2, MapPin } from "lucide-react"
import { getPublicCompanies, type Company } from "../../features/companies/api/companies"
import type { AuthUser } from "../../features/auth/api/auth"
import type { AppPage, UserRole } from "../../shared/routes/appRoutes"

type CompaniesListPageProps = {
    onNavigate?: (page: AppPage, options?: { searchParams?: Record<string, string> }) => void
    currentUser?: AuthUser | null
    role?: UserRole | null
    onLogout?: () => void
}

const CompaniesListPage = ({ onNavigate, currentUser, role, onLogout }: CompaniesListPageProps) => {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [keyword, setKeyword] = useState("")
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const profileMenuRef = useRef<HTMLDivElement | null>(null)

    const loadCompanies = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const params = { limit: 50, q: keyword }
            const res = await getPublicCompanies(params)
            setCompanies(res.companies || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải danh sách công ty')
        } finally {
            setLoading(false)
        }
    }, [keyword])

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

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadCompanies()
        }, 350)

        return () => {
            window.clearTimeout(timer)
        }
    }, [keyword, loadCompanies])

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

            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => onNavigate?.("landing")}
                        className="inline-flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
                    </button>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Khám phá công ty
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Khám phá môi trường làm việc tuyệt vời. Tìm hiểu thêm về các công ty công nghệ hàng đầu tại đây.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
                {/* Search Tool Bar */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-200/60 mb-8 max-w-3xl">
                    <div className="grid gap-2">
                        <div className="relative flex items-center rounded-2xl border border-transparent bg-slate-50 px-4 py-3 transition-all focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                            <Search className="w-5 h-5 shrink-0 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Tìm kiếm tên công ty..."
                                className="w-full bg-transparent border-none px-3 text-slate-900 placeholder:text-slate-500 focus:ring-0 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Companies List */}
                <div className="mt-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">Đang tìm kiếm...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 px-4 rounded-2xl border border-red-100 bg-red-50 text-red-700">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-1">Không thể tải danh sách công ty</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Building2 className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Không tìm thấy công ty nào</h3>
                            <p className="text-slate-600 max-w-md mx-auto">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companies.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => {
                                        onNavigate?.('companyDetails', { searchParams: { companyId: company.id } });
                                    }}
                                    className="group text-left"
                                >
                                    <div className="bg-white border text-left border-slate-200 rounded-2xl p-6 transition-all hover:shadow-xl hover:border-blue-300 hover:ring-4 hover:ring-blue-50 relative flex flex-col h-full cursor-pointer">
                                        <div className="flex gap-4 items-start mb-4">
                                            <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                                                {company.logo_url ? (
                                                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="w-8 h-8 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                                                    {company.name}
                                                </h3>
                                                {company.location && (
                                                    <div className="flex items-center text-slate-500 mt-1 text-sm bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 inline-block" />
                                                        <span className="truncate max-w-37.5 inline-block">{company.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 mt-2">
                                            {company.description && (
                                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                                    {company.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                                            <span className="font-medium text-blue-600 group-hover:underline">Xem việc làm</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default CompaniesListPage

