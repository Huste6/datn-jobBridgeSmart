import { useState } from 'react'
import type { FormEvent } from 'react'
import { User, Phone, MapPin, FileText } from 'lucide-react'
import type { AppPage } from '../../shared/routes/appRoutes'

type ProfilePayload = {
    phone: string
    city: string
    headline: string
}

type Props = {
    defaultName: string
    onNavigate: (page: AppPage) => void
    onSubmitProfile: (payload: ProfilePayload) => void
}

const BasicProfilePage = ({ defaultName, onNavigate, onSubmitProfile }: Props) => {
    const [phone, setPhone] = useState('')
    const [city, setCity] = useState('')
    const [headline, setHeadline] = useState('')

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSubmitProfile({
            phone: phone.trim(),
            city: city.trim(),
            headline: headline.trim(),
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-10">
                <p className="text-sm font-semibold text-blue-600 mb-2">Onboarding</p>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Hồ sơ cơ bản lần đầu đăng nhập</h1>
                <p className="text-slate-600 mb-8">Điền nhanh một vài thông tin để hoàn thiện hồ sơ ban đầu.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                value={defaultName}
                                readOnly
                                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                                    placeholder="09xxxxxxxx"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thành phố</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                                    placeholder="Hà Nội"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu ngắn</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <FileText className="w-5 h-5 text-slate-400" />
                            </div>
                            <textarea
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                required
                                rows={4}
                                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white resize-none"
                                placeholder="Ví dụ: Backend Developer chuyên Golang, 2 năm kinh nghiệm xây dựng API..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Hoàn tất hồ sơ
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigate('landing')}
                            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
                        >
                            Bỏ qua
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BasicProfilePage
