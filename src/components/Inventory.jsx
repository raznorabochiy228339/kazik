import React from 'react'

export default function Inventory({ items = [], onSell, onWithdraw }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Инвентарь</h2>
      {items.length === 0 ? (
        <div className="text-subt text-sm">Пусто. Откройте кейс!</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-3xl bg-black/30 border border-white/5 px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{it.emoji}</span>
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-subt text-xs">{it.rarity} • {it.value_caps} 🧢</div>
                  {it.status !== 'owned' && (
                    <div className="text-[11px] mt-1">
                      {it.status === 'withdraw_requested' ? '⏳ Ожидает выдачи' : '✅ Выдано'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSell(it.id)}
                  disabled={it.status !== 'owned'}
                  className="rounded-3xl px-3 py-2 bg-accent2/90 hover:bg-accent2 disabled:opacity-50 text-black font-medium"
                >
                  Sell
                </button>
                <button
                  onClick={() => onWithdraw(it.id)}
                  disabled={it.status !== 'owned'}
                  className="rounded-3xl px-3 py-2 bg-accent1/90 hover:bg-accent1 disabled:opacity-50 text-white font-medium"
                >
                  Вывести
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
