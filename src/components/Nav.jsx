const TABS = [
  { id: 'planning', label: 'Planning' },
  { id: 'seanceA', label: 'Séance A' },
  { id: 'seanceB', label: 'Séance B' },
  { id: 'seanceC', label: 'Séance C' },
  { id: 'seanceD', label: 'Séance D' },
  { id: 'bras', label: 'Bras' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'carnet', label: 'Carnet' },
  { id: 'regles', label: 'Règles' },
]

export default function Nav({ active, onChange }) {
  return (
    <nav className="sticky top-0 z-10 bg-[#0f0f0f] border-b border-white/10">
      <div className="flex overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id ? 'border-[#e8000d] text-[#e8000d]' : 'border-transparent text-[#f0f0f0]/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
