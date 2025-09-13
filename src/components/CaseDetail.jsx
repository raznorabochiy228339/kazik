import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CaseRoll from './CaseRoll.jsx'

export default function CaseDetail({ getCases, openCase, onAfterOpen, notify }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [win, setWin] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try{
        const all = await getCases()
        const found = all.find(c => String(c.id) === String(id))
        setCaseData(found || null)
      } catch(e){
        notify('Ошибка: ' + e.message, 'accent3')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function handleOpen(quick=false){
    if (rolling) return
    try{
      setWin(null)
      // Получаем реальный предмет с сервера (списывается баланс)
      const res = await openCase(Number(id))
      setWin(res.item)
      if (quick){
        notify(`Вы получили: ${res.item.emoji} ${res.item.name} (+${res.item.value_caps} 🧢)`, 'accent2')
        await onAfterOpen()
      } else {
        setRolling(true)
      }
    } catch(e){
      let msg = e.message
      if (msg.toLowerCase().includes('balance')) msg = 'Недостаточно баланса'
      notify(msg, 'accent3')
      setRolling(false)
    }
  }

  async function handleRollEnd(){
    setRolling(false)
    if (win) {
      notify(`Выпало: ${win.emoji} ${win.name} (+${win.value_caps} 🧢)`, 'accent2')
      await onAfterOpen()
    }
  }

  const items = useMemo(() => caseData?.items_preview ?? [], [caseData])

  if (loading) return <div className="text-subt">Загрузка...</div>
  if (!caseData) return <div className="text-subt">Кейс не найден. <button className="underline" onClick={()=>navigate('/')}>Назад</button></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={()=>navigate('/')} className="rounded-3xl px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10">
          ← Назад
        </button>
        <div className="text-right">
          <div className="text-lg font-semibold flex items-center gap-2 justify-end"><span className="text-2xl">{caseData.icon || '🎁'}</span> {caseData.name}</div>
          <div className="text-subt text-sm">Цена открытия: {caseData.price_caps} 🧢</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CaseRoll
            caseItems={items}
            winningItem={win}
            running={rolling}
            onEnd={handleRollEnd}
          />
          <div className="flex gap-3">
            <button
              onClick={()=>handleOpen(false)}
              disabled={rolling}
              className="flex-1 rounded-3xl px-4 py-3 bg-accent1/90 hover:bg-accent1 disabled:opacity-50 text-white font-semibold"
            >
              Открыть
            </button>
            <button
              onClick={()=>handleOpen(true)}
              disabled={rolling}
              className="flex-1 rounded-3xl px-4 py-3 bg-accent2/90 hover:bg-accent2 disabled:opacity-50 text-black font-semibold"
            >
              Быстрое открытие
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-3xl bg-black/30 border border-white/5 p-4">
            <div className="font-semibold mb-2">Дропы</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {items.map((it, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{it.emoji} {it.name}</span>
                    <span className="text-subt">{it.value_caps} 🧢</span>
                  </div>
                  <div className="text-[11px] text-subt mt-1">{it.rarity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
