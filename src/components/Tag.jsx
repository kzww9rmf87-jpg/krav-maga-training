const TAG_STYLES = {
  CHAUFFE: 'text-[#f0f0f0]/60 border border-[#f0f0f0]/30',
  TRAVAIL: 'bg-[#e8000d]/10 text-[#e8000d] border border-[#e8000d]',
  OPTION: 'bg-blue-500/10 text-blue-400 border border-blue-400',
}

export default function Tag({ type }) {
  if (!type) return null
  return (
    <span
      className={`inline-block text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded whitespace-nowrap ${TAG_STYLES[type] || ''}`}
    >
      {type}
    </span>
  )
}
