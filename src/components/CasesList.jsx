import React from 'react'

export default function CasesList({ cases = [], onOpen }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Кейсы</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((c) => (
          <div key={c.id} className="rounded-3xl bg-black/30 border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold flex items-center gap-2">
                <span className="text-2xl">{c.icon || '🎁'}</span>
                {c.name}
              </div>
              <div className="text-subt text-sm">{c.price_caps} 🧢</div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-subt">
              {c.items_preview.map((it, idx) => (
                <span key={idx} className="px-2 py-1 rounded-2xl bg-white/5 border border-white/10">
                  {it.emoji} {it.name} • {it.value_caps}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => onOpen(c.id)} className="w-full rounded-3xl px-3 py-2 bg-accent1/90 hover:bg-accent1 transition text-white font-medium">
                Открыть кейс
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
