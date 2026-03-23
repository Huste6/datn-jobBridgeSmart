import { useEffect, useState } from 'react'
import { Building2, Globe2, MapPin, Scale, Tags, Users2 } from 'lucide-react'
import HrShell from './HrShell'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'
import { fetchCompanyProfile, type CompanyProfile } from '../../features/hr/api/hrRecruiter'

const HrCompanyProfilePage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [profile, setProfile] = useState<CompanyProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            try {
                const data = await fetchCompanyProfile()
                if (!isMounted) {
                    return
                }
                setProfile(data)
            } catch (error) {
                if (!isMounted) {
                    return
                }
                setErrorMessage(error instanceof Error ? error.message : 'Không thể tải hồ sơ công ty.')
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        load()
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <HrShell
            title="HR: Trang hồ sơ company"
            subtitle="Theo dõi thông tin thương hiệu nhà tuyển dụng xuất hiện trong mỗi tin đăng."
            currentPage="hrCompanyProfile"
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                {isLoading && <p className="text-sm text-slate-600">Đang tải hồ sơ công ty...</p>}
                {!isLoading && errorMessage && <p className="text-sm text-rose-700">{errorMessage}</p>}

                {!profile ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
                        Chưa có dữ liệu company. Hãy tạo company trước.
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 grid place-items-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                                <p className="text-sm text-slate-500">Hồ sơ thương hiệu công ty</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="rounded-xl border border-slate-200 p-4"><span className="font-semibold inline-flex items-center gap-2"><Scale className="w-4 h-4" /> Mã số thuế:</span> {profile.taxCode}</div>
                            <div className="rounded-xl border border-slate-200 p-4"><span className="font-semibold inline-flex items-center gap-2"><Globe2 className="w-4 h-4" /> Website:</span> {profile.website}</div>
                            <div className="rounded-xl border border-slate-200 p-4"><span className="font-semibold inline-flex items-center gap-2"><Tags className="w-4 h-4" /> Lĩnh vực:</span> {profile.industry}</div>
                            <div className="rounded-xl border border-slate-200 p-4"><span className="font-semibold inline-flex items-center gap-2"><Users2 className="w-4 h-4" /> Quy mô:</span> {profile.size}</div>
                            <div className="rounded-xl border border-slate-200 p-4 md:col-span-2"><span className="font-semibold inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Địa điểm:</span> {profile.location}</div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="font-semibold mb-2 text-slate-900">Mô tả công ty</p>
                            <p className="text-slate-700 whitespace-pre-wrap">{profile.description}</p>
                        </div>
                    </>
                )}

                <button onClick={() => onNavigate('hrCompanyCreate')} className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100">
                    Chỉnh sửa company
                </button>
            </div>
        </HrShell>
    )
}

export default HrCompanyProfilePage
