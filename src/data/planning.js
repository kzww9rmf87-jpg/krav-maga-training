export const cyclePattern = ['A', 'Repos', 'B', 'Repos', 'C', 'Repos', 'D', 'Repos']

const SEANCE_LABELS = {
  A: 'Séance A — Force maximale',
  B: 'Séance B — Explosivité + Pieds',
  C: 'Séance C — Circuit conditioning',
  D: 'Séance D — Spécialisation pieds',
  Repos: 'Repos',
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function buildPlanning(startDateISO, days) {
  const result = []
  const d = new Date(startDateISO)
  for (let i = 0; i < days; i++) {
    const code = cyclePattern[i % cyclePattern.length]
    result.push({
      date: new Date(d),
      dayName: DAY_NAMES[d.getDay()],
      code,
      label: SEANCE_LABELS[code],
    })
    d.setDate(d.getDate() + 1)
  }
  return result
}

// 15 jours réels, du 07/07/2026 au 21/07/2026, alignés sur le cycle de 8 jours.
export const planning15 = buildPlanning('2026-07-07T00:00:00', 15)

export function formatDate(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
