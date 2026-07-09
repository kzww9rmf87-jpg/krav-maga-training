import { useState } from 'react'
import Nav from './components/Nav'
import Planning from './pages/Planning'
import Seance from './pages/Seance'
import SeanceC from './pages/SeanceC'
import Nutrition from './pages/Nutrition'
import Carnet from './pages/Carnet'
import Regles from './pages/Regles'
import { seanceA } from './data/seanceA'
import { seanceB } from './data/seanceB'
import { seanceD } from './data/seanceD'
import { bras } from './data/bras'

export default function App() {
  const [tab, setTab] = useState('planning')

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f0f0f0]">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold tracking-tight">
          Krav Maga <span className="text-[#e8000d]">Training</span>
        </h1>
      </header>

      <Nav active={tab} onChange={setTab} />

      <main className="px-4 py-4 pb-10 max-w-2xl mx-auto">
        {tab === 'planning' && <Planning />}
        {tab === 'seanceA' && <Seance data={seanceA} />}
        {tab === 'seanceB' && <Seance data={seanceB} />}
        {tab === 'seanceC' && <SeanceC />}
        {tab === 'seanceD' && <Seance data={seanceD} />}
        {tab === 'bras' && <Seance data={bras} />}
        {tab === 'nutrition' && <Nutrition />}
        {tab === 'carnet' && <Carnet />}
        {tab === 'regles' && <Regles />}
      </main>
    </div>
  )
}
