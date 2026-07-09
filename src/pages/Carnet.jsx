import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { exerciseGroups } from '../data/allExercises'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateFr(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function exportCSV(entries) {
  const header = ['Date', 'Exercice', 'Charge', 'Reps', 'Séries', 'Note']
  const rows = entries.map((e) => [e.date, e.exercise, e.charge, e.reps, e.series, e.note])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `carnet-entrainement-${todayISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Carnet() {
  const [entries, setEntries] = useLocalStorage('carnet-entries', [])
  const [form, setForm] = useState({
    date: todayISO(),
    exercise: exerciseGroups[0].exercises[0],
    charge: '',
    reps: '',
    series: '',
    note: '',
  })

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const entry = { id: Date.now().toString(), ...form }
    setEntries((prev) => [entry, ...prev])
    setForm((f) => ({ ...f, charge: '', reps: '', series: '', note: '' }))
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((en) => en.id !== id))
  }

  const grouped = entries.reduce((acc, entry) => {
    ;(acc[entry.date] = acc[entry.date] || []).push(entry)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[#e8000d]">Carnet</h2>
        {entries.length > 0 && (
          <button
            onClick={() => exportCSV(entries)}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-[#f5c400] text-[#f5c400] shrink-0"
          >
            Exporter CSV
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-lg border border-white/5 p-4 space-y-3">
        <div>
          <label className="text-xs text-[#f0f0f0]/50 block mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-[#f0f0f0]/50 block mb-1">Exercice</label>
          <select
            value={form.exercise}
            onChange={handleChange('exercise')}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm"
          >
            {exerciseGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.exercises.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-[#f0f0f0]/50 block mb-1">Charge</label>
            <input
              type="text"
              placeholder="ex: 85kg"
              value={form.charge}
              onChange={handleChange('charge')}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-[#f0f0f0]/50 block mb-1">Reps</label>
            <input
              type="text"
              placeholder="ex: 5"
              value={form.reps}
              onChange={handleChange('reps')}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#f0f0f0]/50 block mb-1">Séries</label>
            <input
              type="text"
              placeholder="ex: 4"
              value={form.series}
              onChange={handleChange('series')}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#f0f0f0]/50 block mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={handleChange('note')}
            rows={2}
            placeholder="Sensations, technique, douleur..."
            className="w-full bg-[#0f0f0f] border border-white/10 rounded px-3 py-2 text-sm resize-none"
          />
        </div>
        <button type="submit" className="w-full bg-[#e8000d] text-white font-semibold rounded py-2 text-sm">
          Ajouter
        </button>
      </form>

      <div className="space-y-4">
        {dates.length === 0 && <p className="text-sm text-[#f0f0f0]/40 text-center py-6">Aucune entrée pour l'instant.</p>}
        {dates.map((date) => (
          <div key={date}>
            <h3 className="text-xs uppercase tracking-wide text-[#f0f0f0]/40 mb-2">{formatDateFr(date)}</h3>
            <div className="space-y-2">
              {grouped[date].map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#1a1a1a] rounded-lg border border-white/5 px-4 py-3 flex justify-between items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{entry.exercise}</div>
                    <div className="text-sm mt-0.5">
                      {entry.charge && <span className="font-mono text-[#f5c400] mr-2">{entry.charge}</span>}
                      {entry.reps && <span className="text-[#f0f0f0]/70 mr-2">{entry.reps} reps</span>}
                      {entry.series && <span className="text-[#f0f0f0]/70">{entry.series} séries</span>}
                    </div>
                    {entry.note && <div className="text-xs text-[#f0f0f0]/50 mt-1 italic">{entry.note}</div>}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-[#f0f0f0]/40 hover:text-[#e8000d] text-lg leading-none px-1 shrink-0"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
