import { useEffect, useState } from 'react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import MDEditor from '@uiw/react-md-editor'
import {
    createCompanyJob,
    deleteCompanyJob,
    getCompanyJobById,
    getSelectedJobId,
    listCompanyJobs,
    setSelectedJobId,
    updateCompanyJob,
    fetchCompanyProfile,
} from '../../features/hr/api/hrRecruiter'

const emptyForm = {
    title: '',
    company: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: '',
    experienceLevel: 'Junior',
    description: '',
    responsibilitiesText: '',
    requirementsText: '',
    benefitsText: '',
    tagsText: '',
    status: 'open' as 'open' | 'closed',
}

function toLineText(items: string[]): string {
    return (items || []).join('\n')
}

function fromLineText(value: string): string[] {
    return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
}

function fromTagText(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

const HrJobManagementPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [jobs, setJobs] = useState<Array<Awaited<ReturnType<typeof listCompanyJobs>>[number]>>([])
    const [editingJobId, setEditingJobId] = useState<string | null>(getSelectedJobId())
    const [form, setForm] = useState(emptyForm)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [defaultCompany, setDefaultCompany] = useState('')
    const [defaultLocation, setDefaultLocation] = useState('')

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [data, profile] = await Promise.all([
                listCompanyJobs(),
                fetchCompanyProfile().catch(() => null)
            ])
            setJobs(data)

            const compName = profile?.name || ''
            const compLoc = profile?.location || ''
            setDefaultCompany(compName)
            setDefaultLocation(compLoc)

            if (!editingJobId) {
                setForm(prev => ({
                    ...prev,
                    company: prev.company || compName,
                    location: prev.location || compLoc
                }))
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!editingJobId) {
            setForm({ ...emptyForm, company: defaultCompany, location: defaultLocation })
            return
        }

        const job = jobs.find((item) => item.id === editingJobId)
        if (job) {
            setForm({
                title: job.title,
                company: job.company,
                location: job.location,
                employmentType: job.employmentType,
                salaryRange: job.salaryRange,
                experienceLevel: job.experienceLevel,
                description: job.description,
                responsibilitiesText: toLineText(job.responsibilities),
                requirementsText: toLineText(job.requirements),
                benefitsText: toLineText(job.benefits),
                tagsText: (job.tags || []).join(', '),
                status: job.status,
            })
            return
        }

        const loadOne = async () => {
            const oneJob = await getCompanyJobById(editingJobId)
            if (!oneJob) {
                setForm(emptyForm)
                setEditingJobId(null)
                return
            }

            setForm({
                title: oneJob.title,
                company: oneJob.company,
                location: oneJob.location,
                employmentType: oneJob.employmentType,
                salaryRange: oneJob.salaryRange,
                experienceLevel: oneJob.experienceLevel,
                description: oneJob.description,
                responsibilitiesText: toLineText(oneJob.responsibilities),
                requirementsText: toLineText(oneJob.requirements),
                benefitsText: toLineText(oneJob.benefits),
                tagsText: (oneJob.tags || []).join(', '),
                status: oneJob.status,
            })
        }

        loadOne().catch(() => {
            setForm({ ...emptyForm, company: defaultCompany, location: defaultLocation })
            setEditingJobId(null)
        })
    }, [editingJobId, jobs, defaultCompany, defaultLocation])

    const resetCreateMode = () => {
        setSelectedJobId(null)
        setEditingJobId(null)
        setForm({ ...emptyForm, company: defaultCompany, location: defaultLocation })
    }

    return (
        <HrShell
            title="Quản lý tin tuyển dụng"
            subtitle="Tạo mới, cập nhật và theo dõi các vị trí đang tuyển dụng tại công ty của bạn."
            currentPage="hrJobManagement"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="grid xl:grid-cols-[1fr_340px] gap-8 items-start">
                <div className="space-y-6">
                    {isLoading && <p className="text-sm text-slate-500 animate-pulse">Đang tải danh sách job...</p>}

                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">{editingJobId ? 'Cập nhật tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}</h2>
                        {editingJobId && (
                            <button
                                onClick={resetCreateMode}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow"
                            >
                                + Tạo job mới
                            </button>
                        )}
                    </div>

                    <div className="space-y-5">
                        <label className="space-y-1.5 block">
                            <span className="text-sm font-semibold text-slate-700">Tiêu đề job <span className="text-red-500">*</span></span>
                            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300" placeholder="Ví dụ: Senior Frontend Developer" />
                        </label>

                        <label className="space-y-1.5 block">
                            <span className="text-sm font-semibold text-slate-700">Tên công ty <span className="text-red-500">*</span></span>
                            <input value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300" placeholder="Ví dụ: TechCorp VN" />
                        </label>

                        <div className="grid md:grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Địa điểm <span className="text-red-500">*</span></span>
                                <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300" placeholder="Hà Nội, Hồ Chí Minh..." />
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Mức lương</span>
                                <input value={form.salaryRange} onChange={(e) => setForm((prev) => ({ ...prev, salaryRange: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300" placeholder="Thỏa thuận, Lên đến $2000..." />
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Loại hình</span>
                                <div className="relative">
                                    <select value={form.employmentType} onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))} className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white hover:border-slate-300 pr-10">
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="remote">Remote</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Cấp độ kinh nghiệm</span>
                                <div className="relative">
                                    <select value={form.experienceLevel} onChange={(e) => setForm((prev) => ({ ...prev, experienceLevel: e.target.value }))} className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white hover:border-slate-300 pr-10">
                                        <option value="Intern">Intern</option>
                                        <option value="Fresher">Fresher</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Middle">Middle</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Lead">Lead</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Trạng thái</span>
                                <div className="relative">
                                    <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'open' | 'closed' }))} className={`w-full appearance-none px-4 py-2.5 rounded-xl border ${form.status === 'open' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 focus:ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-900 focus:ring-slate-500/20'} focus:outline-none focus:ring-2 focus:border-blue-500 transition-all pr-10 font-medium`}>
                                        <option value="open">🟢 Đang khởi tạo / Đang tuyển</option>
                                        <option value="closed">⚪ Đã đóng</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <label className="space-y-1.5 block pt-2">
                            <span className="text-sm font-semibold text-slate-700">Mô tả công việc</span>
                            <div data-color-mode="light" className="border border-slate-200 rounded-xl overflow-hidden mt-1 hover:border-slate-300 transition-colors bg-white">
                                <MDEditor
                                    value={form.description}
                                    onChange={(val) => setForm(prev => ({ ...prev, description: val || '' }))}
                                    preview="edit"
                                    hideToolbar={false}
                                    height={250}
                                    className="border-0!"
                                />
                            </div>
                        </label>

                        <div className="grid md:grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Trách nhiệm <span className="text-slate-400 font-normal ml-1">(mỗi dòng 1 ý)</span></span>
                                <textarea value={form.responsibilitiesText} onChange={(e) => setForm((prev) => ({ ...prev, responsibilitiesText: e.target.value }))} rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300 resize-y" placeholder="- Phát triển tính năng mới&#10;- Optimize performance" />
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Yêu cầu <span className="text-slate-400 font-normal ml-1">(mỗi dòng 1 ý)</span></span>
                                <textarea value={form.requirementsText} onChange={(e) => setForm((prev) => ({ ...prev, requirementsText: e.target.value }))} rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300 resize-y" placeholder="- 2+ năm kinh nghiệm React&#10;- Tiếng Anh giao tiếp tốt" />
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Quyền lợi <span className="text-slate-400 font-normal ml-1">(mỗi dòng 1 ý)</span></span>
                                <textarea value={form.benefitsText} onChange={(e) => setForm((prev) => ({ ...prev, benefitsText: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300 resize-y" placeholder="- Lương tháng 13&#10;- Bảo hiểm sức khỏe premium" />
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-sm font-semibold text-slate-700">Tags <span className="text-slate-400 font-normal ml-1">(ngăn cách bằng dấu phẩy)</span></span>
                                <textarea value={form.tagsText} onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 bg-white hover:border-slate-300 resize-y" placeholder="React, TypeScript, Nodejs..." />
                            </label>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-4 border-t border-slate-100">
                            <button
                                onClick={async () => {
                                    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
                                        setMessage('Vui lòng nhập ít nhất: tiêu đề, công ty, địa điểm.')
                                        return
                                    }

                                    setIsSaving(true)
                                    setMessage('')
                                    const payload = {
                                        title: form.title,
                                        company: form.company,
                                        location: form.location,
                                        employmentType: form.employmentType,
                                        salaryRange: form.salaryRange,
                                        experienceLevel: form.experienceLevel,
                                        description: form.description,
                                        responsibilities: fromLineText(form.responsibilitiesText),
                                        requirements: fromLineText(form.requirementsText),
                                        benefits: fromLineText(form.benefitsText),
                                        tags: fromTagText(form.tagsText),
                                        status: form.status,
                                    } as const
                                    try {
                                        if (editingJobId) {
                                            await updateCompanyJob(editingJobId, payload)
                                            setMessage('✨ Đã cập nhật job thành công')
                                        } else {
                                            await createCompanyJob(payload)
                                            setMessage('✨ Đã tạo job mới thành công')
                                            resetCreateMode()
                                        }
                                        await loadData()
                                    } catch (error) {
                                        setMessage(`❌ ${error instanceof Error ? error.message : 'Không thể lưu job'}`)
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }}
                                disabled={isSaving}
                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"
                            >
                                {isSaving ? 'Đang lưu...' : editingJobId ? 'Lưu cập nhật' : 'Đăng tin tuyển dụng'}
                            </button>

                            {editingJobId && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Bạn chắc chắn muốn xoá job này? Hành động này không thể hoàn tác.')) {
                                            return
                                        }
                                        try {
                                            await deleteCompanyJob(editingJobId)
                                            setMessage('🗑️ Đã xoá job')
                                            resetCreateMode()
                                            await loadData()
                                        } catch (error) {
                                            setMessage(`❌ ${error instanceof Error ? error.message : 'Không thể xoá job'}`)
                                        }
                                    }}
                                    className="px-6 py-3 rounded-xl border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 transition-all"
                                >
                                    Xoá job
                                </button>
                            )}
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('❌') || message.startsWith('Vui lòng') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:sticky lg:top-24">
                    <h2 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        Danh sách job
                        <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2.5 rounded-full font-medium">{jobs.length}</span>
                    </h2>
                    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                        {jobs.length === 0 && !isLoading && (
                            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <p className="text-slate-500 text-sm">Chưa có job nào.<br />Hãy tạo job đầu tiên nhé!</p>
                            </div>
                        )}
                        {jobs.map((job) => (
                            <button
                                key={job.id}
                                onClick={() => {
                                    setSelectedJobId(job.id)
                                    setEditingJobId(job.id)
                                    setMessage('')
                                }}
                                className={`w-full text-left rounded-xl p-4 transition-all duration-200 focus:outline-none ${editingJobId === job.id
                                    ? 'border-2 border-blue-500 bg-white shadow-md shadow-blue-500/10 scale-[1.02]'
                                    : 'border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <p className={`font-semibold line-clamp-2 ${editingJobId === job.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                        {job.title}
                                    </p>
                                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${job.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div className="flex flex-col gap-1 mt-2.5">
                                    <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        {job.company}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        {job.location} <span className="opacity-40">•</span> {job.salaryRange || 'Thỏa thuận'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </HrShell>
    )
}

export default HrJobManagementPage
