import { SearchX, ArrowLeft } from 'lucide-react'

type AppPage = 'landing' | 'login' | 'register' | 'unauthorized' | 'forbidden' | 'notfound'

const NotFoundPage = ({ onNavigate }: { onNavigate: (page: AppPage) => void }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                    <SearchX className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-2">404 Not Found</p>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Trang không tồn tại</h1>
                <p className="text-slate-600 mb-8">
                    Đường dẫn bạn truy cập không hợp lệ hoặc đã bị di chuyển.
                </p>
                <button
                    onClick={() => onNavigate('landing')}
                    className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay về trang chủ
                </button>
            </div>
        </div>
    )
}

export default NotFoundPage
