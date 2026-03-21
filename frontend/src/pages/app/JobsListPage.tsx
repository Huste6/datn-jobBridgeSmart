import { useEffect, useState } from "react"
import { Briefcase, MapPin, Wallet, Search, Filter } from "lucide-react"
import { fetchJobs, type Job } from "../../features/jobs/api/jobs"

const JobsListPage = () => {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const data = await fetchJobs()
                setJobs(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadJobs()
    }, [])

    return (
        <section className="bg-slate-50 min-h-screen pb-12 w-full">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
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
                <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 mb-8 flex flex-col md:flex-row gap-2">
                    <div className="relative grow flex items-center bg-slate-50 rounded-xl px-4 py-3 md:py-0 border border-transparent focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                        <Search className="text-slate-400 w-5 h-5 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Vị trí ứng tuyển, kỹ năng, công ty..." 
                            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-500 focus:ring-0 px-3 outline-none"
                        />
                    </div>
                    <div className="hidden md:block w-px bg-slate-200 my-2 mx-2"></div>
                    <div className="relative md:w-80 flex items-center bg-slate-50 rounded-xl px-4 py-3 md:py-0 border border-transparent focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                        <MapPin className="text-slate-400 w-5 h-5 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Tất cả địa điểm" 
                            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-500 focus:ring-0 px-3 outline-none"
                        />
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 whitespace-nowrap active:scale-[0.98]">
                        Tìm kiếm
                    </button>
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
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Xóa lọc</button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-4">Mức lương</h4>
                                    <div className="space-y-3">
                                        {["Tất cả mức lương", "Dưới 10 triệu", "10 - 20 triệu", "20 - 40 triệu", "Trên 40 triệu"].map((opt, i) => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input type="radio" name="salary" defaultChecked={i===0} className="w-5 h-5 border-2 border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors" />
                                                </div>
                                                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-4">Hình thức làm việc</h4>
                                    <div className="space-y-3">
                                        {["Toàn thời gian", "Bán thời gian", "Thực tập", "Remote"].map((opt) => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" />
                                                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
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
                                <select className="border-none bg-transparent text-slate-900 font-semibold cursor-pointer focus:ring-0 p-0 text-sm outline-none">
                                    <option>Mới nhất</option>
                                    <option>Lương cao nhất</option>
                                    <option>Phù hợp nhất</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4].map(i => (
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
                                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white text-red-600 font-medium rounded-lg shadow-sm border border-red-100 hover:bg-red-50">Thử lại</button>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy cong viec phù hợp</h3>
                                <p className="text-slate-500 max-w-md mx-auto">Vui lòng thử thay đổi từ khóa tim kiem hoặc điều chỉnh bộ lọc để xem thêm các cơ hội khác.</p>
                                <button className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {jobs.map((job) => (
                                    <article key={job.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 hover:border-blue-300 transition-all duration-300 group cursor-pointer relative overflow-hidden">
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
                                                <Briefcase className="w-4 h-4 text-slate-400" /> Toàn thời gian
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
                                                <button className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm active:scale-95 transition-all">
                                                    Ứng tuyển nhanh
                                                </button>
                                                <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all">
                                                    Lưu tin
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default JobsListPage

