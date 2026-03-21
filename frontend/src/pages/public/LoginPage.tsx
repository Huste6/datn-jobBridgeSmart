import { useState } from 'react'
import type { FormEvent } from 'react'
import { Mail, Lock, ArrowLeft, Briefcase } from 'lucide-react';
import { loginUser } from '../../features/auth/api/auth';
import type { AuthUser } from '../../features/auth/api/auth';
import type { AppPage } from '../../shared/routes/appRoutes';

const LoginPage = ({
    onNavigate,
    onAuthSuccess,
}: {
    onNavigate: (page: AppPage) => void
    onAuthSuccess: (user: AuthUser) => void
}) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const user = await loginUser({ email, password })
            onAuthSuccess(user)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side: Brand & Visual */}
                <div className="md:w-1/2 bg-blue-600 p-8 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-blue-400 to-transparent opacity-50"></div>
                    <div className="relative z-10 w-full">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-12"
                        >
                            <ArrowLeft className="w-5 h-5" /> Về trang chủ
                        </button>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="bg-white p-2 rounded-lg">
                                <Briefcase className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-3xl font-bold">JobBridge AI</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 leading-tight">Chào mừng bạn trở lại!</h2>
                        <p className="text-blue-100 text-lg">
                            Hàng ngàn cơ hội việc làm hấp dẫn đang chờ đón bạn. Đăng nhập để tiếp tục hành trình nghề nghiệp của mình.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <div className="flex -space-x-4">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-200"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-300"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-400"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">+10k</div>
                        </div>
                        <p className="mt-2 text-sm text-blue-100">Ứng viên đã tìm được việc làm thông qua JobBridge AI</p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 relative flex flex-col justify-center">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="md:hidden flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center md:text-left mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập</h1>
                        <p className="text-slate-600">Nhập email và mật khẩu của bạn để truy cập</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Quên mật khẩu?</a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button className="flex justify-center items-center py-2.5 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button className="flex justify-center items-center py-2.5 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Chưa có tài khoản?{' '}
                        <button onClick={() => onNavigate('register')} className="font-semibold text-blue-600 hover:text-blue-500">
                            Đăng ký ngay
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;