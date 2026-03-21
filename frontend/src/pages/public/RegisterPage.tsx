import { useState } from 'react'
import type { FormEvent } from 'react'
import { Mail, Lock, User, ArrowLeft, Briefcase } from 'lucide-react';
import { registerUser } from '../../features/auth/api/auth';
import type { AuthUser } from '../../features/auth/api/auth';
import type { AppPage } from '../../shared/routes/appRoutes';

const RegisterPage = ({
    onNavigate,
    onAuthSuccess,
}: {
    onNavigate: (page: AppPage) => void
    onAuthSuccess: (user: AuthUser) => void
}) => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const user = await registerUser({
                full_name: fullName,
                email,
                password,
            })
            onAuthSuccess(user)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse">

                {/* Right Side: Brand & Visual (Reversed for Register) */}
                <div className="md:w-1/2 bg-slate-900 p-8 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900 opacity-80"></div>
                    <div className="relative z-10 w-full text-right flex flex-col items-end">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12"
                        >
                            Về trang chủ <ArrowLeft className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="flex items-center gap-2 mb-8 justify-end">
                            <span className="text-3xl font-bold">JobBridge AI</span>
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 leading-tight">Khởi đầu sự nghiệp<br />mơ ước</h2>
                        <p className="text-slate-300 text-lg text-right">
                            Tạo hồ sơ miễn phí, nhận đánh giá CV từ AI và nhận gợi ý công việc phù hợp với năng lực của bạn nhất.
                        </p>
                    </div>

                    <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 mt-8">
                        <div className="flex gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                <span className="font-bold text-lg">AI</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Smart Match Technology</p>
                                <p className="text-sm text-slate-300 mt-1">Hệ thống AI của chúng tôi sẽ phân tích CV và tìm ra công việc phù hợp nhất với tỷ lệ chính xác lên đến 95%.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Side: Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 relative flex flex-col justify-center">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="md:hidden flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center md:text-left mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h1>
                        <p className="text-slate-600">Đăng ký để trải nghiệm sức mạnh của AI</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="Xây dựng mật khẩu mạnh"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex items-start mt-4 mb-6">
                            <div className="flex items-center h-5">
                                <input id="terms" type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" required />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="text-slate-600">
                                    Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
                                </label>
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-2">
                            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Đã có tài khoản?{' '}
                        <button onClick={() => onNavigate('login')} className="font-semibold text-blue-600 hover:text-blue-500">
                            Đăng nhập ngay
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;