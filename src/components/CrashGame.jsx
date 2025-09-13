import React, { useEffect, useRef, useState } from 'react'

export default function CrashGame({ user, setUser, notify }) {
  const [bet, setBet] = useState(10)
  const [running, setRunning] = useState(false)
  const [mult, setMult] = useState(1)
  const [crashed, setCrashed] = useState(false)
  const rafRef = useRef(null)
  const startTimeRef = useRef(0)
  const crashTimeRef = useRef(0)
  const cashedOutRef = useRef(false)

  function notifyLocal(msg, tone='accent2'){ if (notify) notify(msg, tone) }

  function startRound(){
    if (running) return
    const balance = user?.balance_caps ?? 0
    if (bet <= 0 || bet > balance){
      notifyLocal('Неверная ставка', 'accent3'); return
    }
    // deduct bet immediately
    setUser(prev => ({ ...prev, balance_caps: (prev?.balance_caps ?? 0) - bet }))
    setRunning(true); setCrashed(false); setMult(0.5); cashedOutRef.current=false
    // choose random duration between 1 and 10 seconds
    const duration = 1000 + Math.random() * 9000
    // we will model multiplier starting at 0.5 and growing exponentially so it's smooth
    startTimeRef.current = performance.now()
    crashTimeRef.current = startTimeRef.current + duration
    // animation loop
    function step(t){
      const elapsed = t - startTimeRef.current
      if (t >= crashTimeRef.current){
        // crash now
        setCrashed(true); setRunning(false)
        setMult(prev => prev) // keep last value
        notifyLocal('Крушение! Вы проиграли ставку', 'accent3')
        cancelAnimationFrame(rafRef.current)
        return
      }
      // normalized progress 0..1
      const p = Math.max(0, elapsed / duration)
      // exponential growth from 0.5 to maybe up to 10x at end: use factor
      const current = 0.5 * Math.pow( (10/0.5), p ) // from 0.5 to 10
      setMult(current)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function cashout(){
    if (!running || cashedOutRef.current) return
    cashedOutRef.current = true
    // compute current multiplier, add to balance
    const won = +(bet * mult).toFixed(2)
    setUser(prev => ({ ...prev, balance_caps: (prev?.balance_caps ?? 0) + won }))
    setRunning(false)
    setCrashed(false)
    notifyLocal(`Вы забрали ${won} 🧢 (x${mult.toFixed(2)})`, 'accent2')
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  useEffect(()=>{
    return ()=>{ if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  },[])

  return (
    <div className="max-w-lg mx-auto mt-6">
      <div className="bg-white/3 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>Баланс: <strong>{user?.balance_caps ?? 0} 🧢</strong></div>
          <div>Ставка:
            <input className="ml-2 w-24 bg-transparent border px-2 py-1 rounded" type="number" value={bet} onChange={e=>setBet(Number(e.target.value))} />
          </div>
        </div>

        <div className="h-40 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded mb-3">
          <div className="text-4xl font-bold">
            {running ? mult.toFixed(2) + 'x' : (crashed ? 'Crash' : 'Готово')}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-2 rounded-2xl bg-accent2 text-white" onClick={startRound} disabled={running}>
            Запустить
          </button>
          <button className="flex-1 py-2 rounded-2xl bg-accent3 text-white" onClick={cashout} disabled={!running}>
            Забрать
          </button>
        </div>

        <div className="text-xs text-subt mt-3">
          Игра: самолётик взлетает в геометрической прогрессии, начинает с 0.5x. Длительность раунда случайна от 1 до 10 секунд.
        </div>
      </div>
    </div>
  )
}