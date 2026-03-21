type Props = {
    title: string
    subtitle: string
}

const AppHomeContent = ({ title, subtitle }: Props) => {
    return (
        <section className="max-w-4xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
            <p className="text-slate-600 mb-8">{subtitle}</p>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Thống kê 1</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Thống kê 2</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">24</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <p className="text-sm text-slate-500">Thống kê 3</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">36</p>
                </div>
            </div>
        </section>
    )
}

export default AppHomeContent
