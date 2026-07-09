import Tag from './Tag'

const TAG_LABEL = { chauffe: 'CHAUFFE', travail: 'TRAVAIL', option: 'OPTION' }

export default function SetTable({ groups }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left text-[#f0f0f0]/50 text-xs uppercase">
          <th className="py-1 pr-2 font-normal">Série</th>
          <th className="py-1 pr-2 font-normal">Charge</th>
          <th className="py-1 pr-2 font-normal">Reps</th>
          <th className="py-1 font-normal"></th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group, gi) =>
          group.rows.map((row, ri) => (
            <tr
              key={`${gi}-${ri}`}
              className={`border-t border-[#f0f0f0]/10 ${group.type === 'chauffe' ? 'opacity-60' : ''}`}
            >
              <td className="py-1.5 pr-2 text-[#f0f0f0]/70 whitespace-nowrap">{row.serie ?? ri + 1}</td>
              <td className="py-1.5 pr-2 font-mono text-[#f5c400] whitespace-nowrap">{row.charge}</td>
              <td className="py-1.5 pr-2 whitespace-nowrap">{row.reps}</td>
              <td className="py-1.5 text-right">
                <Tag type={TAG_LABEL[group.type]} />
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}
