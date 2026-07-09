import { cyclePattern, planning15, formatDate } from '../data/planning'

const CODE_COLOR = {
  A: 'text-[#e8000d]',
  B: 'text-[#e8000d]',
  C: 'text-[#e8000d]',
  D: 'text-[#e8000d]',
  Repos: 'text-[#f0f0f0]/40',
}

export default function Planning() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#e8000d]">Planning</h2>
        <p className="text-sm text-[#f0f0f0]/60 mt-1">Cycle de 8 jours répété en continu</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-4">
        <div className="flex flex-wrap gap-3">
          {cyclePattern.map((code, i) => (
            <div key={i} className="flex flex-col items-center min-w-[44px]">
              <span className="text-[10px] text-[#f0f0f0]/40">J{i + 1}</span>
              <span className={`font-mono font-bold ${CODE_COLOR[code]}`}>{code === 'Repos' ? '—' : code}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Planning du 07/07 au 21/07/2026</h3>
        <div className="space-y-1.5">
          {planning15.map((day, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] rounded-lg border border-white/5 px-3 py-2 flex items-center justify-between gap-2"
            >
              <div className="shrink-0">
                <span className="font-mono text-sm text-[#f0f0f0]/80">{formatDate(day.date)}</span>
                <span className="text-xs text-[#f0f0f0]/40 ml-2">{day.dayName}</span>
              </div>
              <span className={`text-sm font-semibold text-right ${CODE_COLOR[day.code]}`}>{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
