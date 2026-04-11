import { useEffect, useRef, useState } from 'react';
import { Search, Briefcase, Bot, LineChart, CheckCircle, ArrowRight, UserCircle2, LogOut, ChevronDown, FileText } from 'lucide-react';
import type { AuthUser } from '../../features/auth/api/auth';
import type { AppPage } from '../../shared/routes/appRoutes';

const LandingPage = ({
    onNavigate,
    currentUser,
    onLogout,
}: {
    onNavigate?: (page: AppPage) => void
    currentUser: AuthUser | null
    onLogout: () => void
}) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (!profileMenuRef.current) {
                return;
            }

            const target = event.target as Node;
            if (!profileMenuRef.current.contains(target)) {
                setIsProfileMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', onMouseDown);
        return () => {
            window.removeEventListener('mousedown', onMouseDown);
        };
    }, []);

    const initials = (currentUser?.full_name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('landing')}>
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                                JobBridge AI
                            </span>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <button onClick={() => onNavigate?.('jobsList')} className="text-slate-600 hover:text-blue-600 font-medium">Tìm việc làm</button>
                            <button onClick={() => onNavigate?.('companiesList')} className="text-slate-600 hover:text-blue-600 font-medium">Công ty</button>
                            <button onClick={() => onNavigate?.('aiCoach')} className="text-slate-600 hover:text-blue-600 font-medium">AI luyện phỏng vấn</button>
                        </nav>
                        <div className="flex items-center gap-4">
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
                                        <span className="hidden sm:block text-sm text-slate-700 max-w-35 truncate">{currentUser.full_name}</span>
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
                                                    setIsProfileMenuOpen(false);
                                                    onNavigate?.('appProfile');
                                                }}
                                                className="w-full mt-1 px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                                            >
                                                <UserCircle2 className="w-4 h-4" /> Trang cá nhân
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    onNavigate?.('applications');
                                                }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" /> CV đã ứng tuyển
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    onLogout();
                                                }}
                                                className="w-full px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onNavigate?.('login')}
                                        className="text-slate-600 hover:text-blue-600 font-medium px-4 py-2"
                                    >
                                        Đăng nhập
                                    </button>
                                    <button
                                        onClick={() => onNavigate?.('register')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                    >
                                        Đăng ký
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="grow">
                <section className="relative bg-white pt-16 pb-24 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm mb-6">
                                <Bot className="w-4 h-4" />
                                <span>Tuyển dụng thông minh thế hệ mới với AI</span>
                            </div>
                            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
                                Kết nối <span className="text-blue-600">Đúng Người</span> với <span className="text-blue-600">Đúng Việc</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-10">
                                Khám phá cơ hội nghề nghiệp lý tưởng cùng trợ lý AI thông minh. Đánh giá CV, gợi ý việc làm chuẩn xác và chuẩn bị phỏng vấn tự động.
                            </p>

                            {/* Search Bar */}
                            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
                                <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-colors">
                                    <Search className="h-5 w-5 text-slate-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Chức danh, kỹ năng hoặc tên công ty..."
                                        className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-colors">
                                    <Briefcase className="h-5 w-5 text-slate-400 mr-3" />
                                    <select className="bg-transparent border-none outline-none w-full text-slate-800 appearance-none">
                                        <option value="">Tất cả địa điểm</option>
                                        <option value="hn">Hà Nội</option>
                                        <option value="hcm">Hồ Chí Minh</option>
                                        <option value="dn">Đà Nẵng</option>
                                    </select>
                                </div>
                                <button onClick={() => onNavigate?.('jobsList')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    Tìm Việc Ngay
                                </button>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
                                <span>Gợi ý:</span>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer transition-colors">React</span>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer transition-colors">Golang</span>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer transition-colors">DevOps</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Sức Mạnh Của Công Nghệ AI</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">Trải nghiệm quá trình tìm việc và tuyển dụng mượt mà hơn bao giờ hết nhờ vào hệ thống phân tích thông minh của JobBridge AI.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: <Bot className="w-8 h-8 text-blue-600" />, title: "AI Phân Tích CV", desc: "Tự động trích xuất thông tin, đánh giá điểm mạnh yếu và đưa ra gợi ý cải thiện CV trực tiếp." },
                                { icon: <CheckCircle className="w-8 h-8 text-emerald-600" />, title: "Job Matching Smart Score", desc: "Thuật toán tính điểm độ phù hợp giữa CV của bạn và bản mô tả công việc (JD) với độ chính xác cao." },
                                { icon: <LineChart className="w-8 h-8 text-purple-600" />, title: "Mock Interview AI", desc: "Luyện tập phỏng vấn với các câu hỏi do AI tạo ra dựa vào JD thực tế trước khi gặp nhà tuyển dụng." }
                            ].map((feature, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Latest Jobs Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Việc Làm Nổi Bật</h2>
                                <p className="text-slate-600">Những cơ hội nghề nghiệp tốt nhất được cập nhật liên tục.</p>
                            </div>
                            <button onClick={() => onNavigate?.('jobsList')} className="hidden sm:inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
                                Xem tất cả <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "Senior React Developer", company: "TechCorp VN", location: "Hồ Chí Minh", salary: "1,500 - 2,500 USD", tags: ["React", "TypeScript"] },
                                { title: "Golang Backend Engineer", company: "VinaPlatform", location: "Hà Nội", salary: "1,000 - 2,000 USD", tags: ["Golang", "Microservices"] },
                                { title: "AI/ML Engineer", company: "DataSmart", location: "Đà Nẵng", salary: "Thoả thuận", tags: ["Python", "TensorFlow"] },
                                { title: "UX/UI Designer", company: "Creative Studio", location: "Hồ Chí Minh", salary: "800 - 1,500 USD", tags: ["Figma", "UI Design"] },
                                { title: "DevOps Engineer", company: "CloudSys", location: "Hà Nội", salary: "2,000 - 3,500 USD", tags: ["AWS", "Kubernetes"] },
                                { title: "Product Manager", company: "FinTech Asia", location: "Hồ Chí Minh", salary: "1,500 - 2,800 USD", tags: ["Agile", "Product"] }
                            ].map((job, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer bg-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">
                                            {job.company.charAt(0)}
                                        </div>
                                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">Hot</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{job.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4">{job.company}</p>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            {job.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            {job.salary}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        {job.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{tag}</span>
                                        ))}
                                    </div>

                                    <button className="w-full py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                                        Ứng tuyển ngay
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 text-center sm:hidden">
                            <button onClick={() => onNavigate?.('jobsList')} className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
                                Xem tất cả việc làm <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Top Employers Section */}
                <section className="py-20 bg-slate-50 border-y border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Nhà Tuyển Dụng Hàng Đầu</h2>
                            <p className="text-slate-600">Hàng trăm doanh nghiệp tin tưởng JobBridge AI để tìm kiếm nhân tài.</p>
                        </div>

                        {/* Logo clouds */}
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                            {/* Fake logos using divs */}
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2 text-2xl font-black text-slate-800">
                                    <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-white">C{i + 1}</div>
                                    Company {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-blue-600 py-16 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white to-transparent"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-6">Sẵn sàng để bước vào kỷ nguyên tuyển dụng mới?</h2>
                        <div className="flex justify-center gap-4">
                            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                                Tạo Hồ Sơ Miễn Phí <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onNavigate?.('hrCompanyCreate')}
                                className="border-2 border-white/30 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
                            >
                                Dành Cho Nhà Tuyển Dụng
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="h-6 w-6 text-blue-400" />
                            <span className="text-xl font-bold text-white">JobBridge AI</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm mb-6">
                            Nền tảng hỗ trợ việc làm thông minh. Áp dụng AI, Cloud computing và phân tích dữ liệu chuyên sâu để tạo ra giá trị cho cộng đồng.
                        </p>
                        <p className="text-xs text-slate-500">© 2026 JobBridge AI. Đồ án tốt nghiệp.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Dành cho Ứng viên</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-blue-400">Việc làm IT</a></li>
                            <li><a href="#" className="hover:text-blue-400">Tạo CV với AI</a></li>
                            <li><a href="#" className="hover:text-blue-400">Blog Tư vấn</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Nhà Tuyển Dụng</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-blue-400">Đăng tin tuyển dụng</a></li>
                            <li><a href="#" className="hover:text-blue-400">Tìm kiếm hồ sơ</a></li>
                            <li><a href="#" className="hover:text-blue-400">Bảng giá dịch vụ</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
