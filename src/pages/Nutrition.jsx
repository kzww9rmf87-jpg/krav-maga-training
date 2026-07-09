import { nutrition } from '../data/nutrition'

export default function Nutrition() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#e8000d]">Nutrition</h2>
        <p className="text-sm text-[#f0f0f0]/60 mt-1">Journée type</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-4 flex justify-around text-center">
        <div>
          <div className="font-mono text-2xl text-[#f5c400] font-bold">{nutrition.totalKcal}</div>
          <div className="text-xs text-[#f0f0f0]/50 uppercase">kcal</div>
        </div>
        <div>
          <div className="font-mono text-2xl text-[#f5c400] font-bold">{nutrition.totalProtein}g</div>
          <div className="text-xs text-[#f0f0f0]/50 uppercase">Protéines</div>
        </div>
      </div>

      <div className="space-y-2">
        {nutrition.meals.map((meal, i) => (
          <div key={i} className="bg-[#1a1a1a] rounded-lg border border-white/5 px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[#f5c400] text-sm">{meal.heure}</span>
              <span className="text-xs text-[#f0f0f0]/50 whitespace-nowrap">
                {meal.kcal} kcal · {meal.proteines}g prot
              </span>
            </div>
            <div className="text-sm font-semibold mt-0.5">{meal.nom}</div>
            <div className="text-sm text-[#f0f0f0]/70 mt-1">{meal.aliments}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Supplémentation</h3>
        <div className="space-y-1.5">
          {nutrition.supplements.map((s, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] rounded-lg border border-white/5 px-4 py-2 flex justify-between items-center text-sm gap-2"
            >
              <span className="text-[#f0f0f0]/70">{s.moment}</span>
              <span className="font-semibold">{s.produit}</span>
              <span className="font-mono text-[#f5c400]">{s.dose}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
