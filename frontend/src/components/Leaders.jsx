import React from 'react'

export default function Leaders({ leaders = [], meId }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Топ игроков</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-subt">
            <tr>
              <th className="text-left font-normal pb-2">#</th>
              <th className="text-left font-normal pb-2">Игрок</th>
              <th className="text-right font-normal pb-2">Баланс</th>
              <th className="text-right font-normal pb-2">Предметы</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((u, i) => (
              <tr key={u.id} className={`${u.id === meId ? 'text-accent2' : ''}`}>
                <td className="py-1 pr-2">{i + 1}</td>
                <td className="py-1 pr-2">{u.username}</td>
                <td className="py-1 pr-2 text-right">{u.balance_caps} 🧢</td>
                <td className="py-1 pr-2 text-right">{u.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
