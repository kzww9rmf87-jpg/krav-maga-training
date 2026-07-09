import { seanceC } from '../data/seanceC'

export default function SeanceC() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#e8000d]">{seanceC.title}</h2>
        <p className="text-sm text-[#f0f0f0]/60 mt-1">{seanceC.subtitle}</p>
      </div>

      <div className="space-y-2">
        {seanceC.circuit.map((ex, i) => (
          <div
            key={i}
            className="bg-[#1a1a1a] rounded-lg border border-white/5 px-4 py-3 flex items-center justify-between gap-2"
          >
            <div>
              <span className="text-[#f5c400] font-mono mr-2">{i + 1}.</span>
              <span className="font-medium">{ex.name}</span>
              <div className="text-xs text-[#f0f0f0]/50 mt-0.5 ml-6">{ex.detail}</div>
            </div>
            <span className="text-xs text-[#f0f0f0]/40 whitespace-nowrap shrink-0">
              {i < seanceC.circuit.length - 1 ? '⏱ 0 sec →' : '⏱ voir progression'}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Progression sur 8 semaines</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[#f0f0f0]/50 text-xs uppercase">
              <th className="py-1 pr-2 font-normal">Semaines</th>
              <th className="py-1 pr-2 font-normal">Circuits</th>
              <th className="py-1 font-normal">Repos entre circuits</th>
            </tr>
          </thead>
          <tbody>
            {seanceC.progression.map((p, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="py-2 pr-2 whitespace-nowrap">{p.semaines}</td>
                <td className="py-2 pr-2 font-mono text-[#f5c400] whitespace-nowrap">{p.circuits}</td>
                <td className="py-2">{p.repos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#f0f0f0]/60 italic border-l-2 border-[#f5c400]/40 pl-2">{seanceC.note}</p>
    </div>
  )
}
