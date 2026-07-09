import { regles } from '../data/regles'

function Section({ title, items, color }) {
  return (
    <div>
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#f0f0f0]/80 pl-4 relative">
            <span className="absolute left-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Regles() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#e8000d]">Règles</h2>
      </div>

      <Section title="Faire" items={regles.faire} color="text-[#f5c400]" />
      <Section title="Ne pas faire" items={regles.neReglePasFaire} color="text-[#e8000d]" />
      <Section title="Signaux d'alerte" items={regles.signauxAlerte} color="text-[#e8000d]" />
      <Section title="Progression des charges" items={regles.progressionCharges} color="text-[#f5c400]" />

      <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Stop & Go</h3>
          <p className="text-sm text-[#f0f0f0]/70">{regles.stopAndGo}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Antinomie puissance-endurance</h3>
          <p className="text-sm text-[#f0f0f0]/70">{regles.antinomie}</p>
        </div>
      </div>
    </div>
  )
}
