import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Camera, House, Loader2 } from 'lucide-react'
import { fetchMe, updateMe, uploadAvatar } from '../../features/auth/api/auth'
import type { AuthUser } from '../../features/auth/api/auth'
import type { AppPage } from '../../shared/routes/appRoutes'

type Props = {
    currentUser: AuthUser
    onUserUpdated: (user: AuthUser) => void
    onNavigate: (page: AppPage) => void
}

const ProfilePage = ({ currentUser, onUserUpdated, onNavigate }: Props) => {
    const [user, setUser] = useState<AuthUser>(currentUser)
    const [fullName, setFullName] = useState(currentUser.full_name)
    const [phone, setPhone] = useState(currentUser.phone ?? '')
    const [city, setCity] = useState(currentUser.city ?? '')
    const [headline, setHeadline] = useState(currentUser.headline ?? '')
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url ?? '')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    useEffect(() => {
        const loadMe = async () => {
            setIsLoading(true)
            setError('')

            try {
                const me = await fetchMe()
                setUser(me)
                setFullName(me.full_name)
                setPhone(me.phone ?? '')
                setCity(me.city ?? '')
                setHeadline(me.headline ?? '')
                setAvatarUrl(me.avatar_url ?? '')
                onUserUpdated(me)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không tải được thông tin cá nhân')
            } finally {
                setIsLoading(false)
            }
        }

        loadMe()
    }, [])

    const initials = useMemo(() => {
        const base = fullName || user.full_name || 'User'
        return base
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
    }, [fullName, user.full_name])

    const handleAvatarPick = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh hợp lệ')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Ảnh tối đa 2MB')
            return
        }

        try {
            setError('')
            setSuccess('')
            setIsUploadingAvatar(true)
            const updated = await uploadAvatar(file)
            setUser(updated)
            setAvatarUrl(updated.avatar_url ?? '')
            onUserUpdated(updated)
            setSuccess('Cập nhật avatar thành công')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cập nhật avatar thất bại')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setSuccess('')
        setIsSaving(true)

        try {
            const updated = await updateMe({
                full_name: fullName.trim(),
                phone: phone.trim(),
                city: city.trim(),
                headline: headline.trim(),
            })
            setUser(updated)
            setAvatarUrl(updated.avatar_url ?? '')
            onUserUpdated(updated)
            setSuccess('Cập nhật thông tin thành công')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể lưu thông tin cá nhân')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 min-h-80 grid place-items-center text-slate-500">
                <div className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải hồ sơ...</div>
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-semibold text-blue-600 mb-2">Trang cá nhân</p>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Thông tin tài khoản</h1>
                    <p className="text-slate-600">Dữ liệu được lấy từ API /api/users/me và có thể cập nhật ngay tại đây.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate('landing')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                    >
                        <House className="w-4 h-4" /> Về trang chủ
                    </button>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{user.role || 'Chưa chọn vai trò'}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white grid place-items-center overflow-hidden shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold">{initials || 'U'}</span>
                        )}
                    </div>

                    <div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700">
                            <Camera className="w-4 h-4" /> Cập nhật avatar
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} disabled={isUploadingAvatar} />
                        </label>
                        <p className="mt-2 text-xs text-slate-500">Chọn ảnh JPG/PNG, tối đa 2MB, lưu vào Cloudinary folder jobbridge/user.</p>
                        {isUploadingAvatar && <p className="mt-2 text-xs text-blue-600">Đang tải avatar lên...</p>}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            value={user.email}
                            readOnly
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Thành phố</label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu ngắn</label>
                    <textarea
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white resize-none"
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </form>
        </div>
    )
}

export default ProfilePage
