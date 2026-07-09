import ExerciseCard from '../components/ExerciseCard'

export default function Seance({ data }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#e8000d]">{data.title}</h2>
        {data.subtitle && <p className="text-sm text-[#f0f0f0]/60 mt-1">{data.subtitle}</p>}
      </div>
      <div className="space-y-3">
        {data.exercises.map((ex, i) => (
          <ExerciseCard key={i} exercise={ex} />
        ))}
      </div>
    </div>
  )
}
