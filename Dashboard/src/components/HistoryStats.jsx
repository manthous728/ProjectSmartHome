import { useState } from 'react'

export default function HistoryStats({ stats, label, unit = '', color = 'slate', isRealtime = false }) {
    const [showTooltip, setShowTooltip] = useState(false)

    if (!stats) return null

    // Ensure stats numbers are valid, default to 0 if missing
    const min = stats[`${label}_min`] ?? 0
    const avg = stats[`${label}_avg`] ?? 0
    const max = stats[`${label}_max`] ?? 0

    const colorClasses = {
        slate: 'bg-slate-50 text-slate-700',
        red: 'bg-red-50 text-red-700',
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        yellow: 'bg-yellow-50 text-yellow-700',
        orange: 'bg-orange-50 text-orange-700',
        purple: 'bg-purple-50 text-purple-700',
        teal: 'bg-teal-50 text-teal-700',
    }

    const activeColor = colorClasses[color] || colorClasses.slate

    return (
        <div className="relative">
            <div
                className={`rounded-lg px-3 py-2 text-xs font-medium shadow-sm ${activeColor} flex items-center gap-2 mt-2 cursor-pointer transition-all hover:shadow-md`}
                onClick={() => isRealtime && setShowTooltip(!showTooltip)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-70">Min</span>
                    <span className="font-bold">{Number(min).toFixed(1)}{unit}</span>
                </div>
                <div className="w-px h-6 bg-current opacity-20 mx-1"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-70">Avg</span>
                    <span className="font-bold">{Number(avg).toFixed(1)}{unit}</span>
                </div>
                <div className="w-px h-6 bg-current opacity-20 mx-1"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-70">Max</span>
                    <span className="font-bold">{Number(max).toFixed(1)}{unit}</span>
                </div>
            </div>

            {showTooltip && isRealtime && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Diambil dari 100 data terakhir
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 transform rotate-45"></div>
                </div>
            )}
        </div>
    )
}
