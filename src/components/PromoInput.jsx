import React, { useState } from 'react'

export default function PromoInput({ onActivate }) {
  const [code, setCode] = useState('FREE100')
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Промокод</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-3xl bg-black/30 border border-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-accent2/60"
          placeholder="Введите код (FREE100, START50)"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button
          onClick={() => onActivate(code)}
          className="rounded-3xl px-4 py-2 bg-accent3 hover:brightness-110 text-black font-semibold"
          title="Активировать промокод"
        >
          Activate
        </button>
      </div>
    </div>
  )
}
