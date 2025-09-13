import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function CaseRoll({ caseItems, winningItem, onEnd, running }) {
  const [offset, setOffset] = useState(0)

  const pool = useMemo(() => {
    const arr = []
    for (let i=0;i<55;i++) arr.push(caseItems[Math.floor(Math.random()*caseItems.length)])
    arr.push(winningItem || caseItems[0])
    arr.push(...Array(4).fill(caseItems[Math.floor(Math.random()*caseItems.length)]))
    return arr
  }, [caseItems, winningItem])

  useEffect(() => {
    if (!running) return
    const cardW = 90
    const targetIndex = pool.length - 5
    const total = targetIndex * cardW
    const duration = 3000
    const start = performance.now()
    function frame(t){
      const p = Math.min(1, (t - start)/duration)
      const ease = 1 - Math.pow(1 - p, 3)
      const x = -total * ease
      setOffset(x)
      if (p < 1) requestAnimationFrame(frame)
      else onEnd && onEnd()
    }
    const raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [running])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 py-4">
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-accent2/70 -translate-x-1/2"></div>
      <div className="flex gap-2 px-4 will-change-transform" style={{ transform: `translateX(${offset}px)`}}>
        {pool.map((it, idx) => (
          <div key={idx} className="min-w-[90px] rounded-2xl bg-white/5 border border-white/10 text-center px-3 py-3">
            <div className="text-2xl">{it.emoji}</div>
            <div className="text-xs mt-1">{it.name}</div>
            <div className="text-[10px] text-subt">{it.value_caps} 🧢</div>
          </div>
        ))}
      </div>
    </div>
  )
}
