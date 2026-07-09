import { useState } from 'react'
import SetTable from './SetTable'

export default function ExerciseCard({ exercise }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <h3 className="font-semibold text-[#f0f0f0]">{exercise.name}</h3>
          {exercise.rest && <span className="text-xs text-[#f0f0f0]/50">⏱ {exercise.rest}</span>}
        </div>
        <span className={`text-[#f0f0f0]/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {exercise.groups && <SetTable groups={exercise.groups} />}
          {exercise.freeText && <p className="text-sm text-[#f0f0f0]/80 mt-2">{exercise.freeText}</p>}
          {exercise.note && (
            <p className="text-xs text-[#f0f0f0]/60 mt-3 italic border-l-2 border-[#f5c400]/40 pl-2">
              {exercise.note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
