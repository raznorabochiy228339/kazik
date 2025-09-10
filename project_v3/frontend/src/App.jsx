import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import CasesList from './components/CasesList.jsx'
import PromoInput from './components/PromoInput.jsx'
import Inventory from './components/Inventory.jsx'
import Leaders from './components/Leaders.jsx'
import CaseDetail from './components/CaseDetail.jsx'

const API = {
  async _error(r){
    try { const j = await r.json(); throw new Error(j.detail || j.message || r.statusText) }
    catch { const t = await r.text(); throw new Error(t || 'Request failed') }
  },
  async auth(username) {
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: '', username })
    })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async me(token) {
    const r = await fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async cases(token) {
    const r = await fetch('/api/cases', { headers: { Authorization: 'Bearer ' + token } })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async openCase(token, id, free=false) {
    const r = await fetch(`/api/cases/${id}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ free })
    })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async inventory(token) {
    const r = await fetch('/api/inventory', { headers: { Authorization: 'Bearer ' + token } })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async sell(token, item_id) {
    const r = await fetch('/api/inventory/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ item_id })
    })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async withdrawRequest(token, item_id) {
    const r = await fetch('/api/inventory/withdraw_request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ item_id })
    })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async leaders(token) {
    const r = await fetch('/api/leaders', { headers: { Authorization: 'Bearer ' + token } })
    if (!r.ok) return this._error(r)
    return r.json()
  },
  async promo(token, code) {
    const r = await fetch('/api/promocode/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ code })
    })
    if (!r.ok) return this._error(r)
    return r.json()
  },
}

function Card({children, className=''}) {
  return (
    <div className={`rounded-3xl bg-card/90 border border-white/5 shadow-glow p-5 ${className}`}>
      {children}
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [cases, setCases] = useState([])
  const [inventory, setInventory] = useState([])
  const [leaders, setLeaders] = useState([])
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  function notify(msg, tone='accent1') {
    setToast({ msg, tone })
    setTimeout(()=>setToast(null), 2500)
  }

  useEffect(() => {
    ;(async () => {
      try{
        const username = 'Player' + Math.floor(Math.random()*10000)
        const { session_token } = await API.auth(username)
        setToken(session_token)
      } catch(e){
        notify('Ошибка авторизации: ' + e.message, 'accent3')
      }
    })()
  }, [])

  async function refreshAll() {
    if (!token) return
    const [me, inv, lead, cs] = await Promise.all([API.me(token), API.inventory(token), API.leaders(token), API.cases(token)])
    setUser(me); setInventory(inv); setLeaders(lead); setCases(cs)
  }

  useEffect(() => { if (token) refreshAll() }, [token])

  const balance = user?.balance_caps ?? 0

  async function handleSell(item_id) {
    try {
      const res = await API.sell(token, item_id)
      notify(`Продано! Новый баланс: ${res.balance_caps} 🧢`, 'accent2')
      await refreshAll()
    } catch (e) {
      notify('Ошибка продажи: ' + e.message, 'accent3')
    }
  }

  async function handleWithdraw(item_id) {
    try {
      const res = await API.withdrawRequest(token, item_id)
      notify(`Заявка на вывод отправлена`, 'accent2')
      await refreshAll()
    } catch (e) {
      notify('Ошибка вывода: ' + e.message, 'accent3')
    }
  }

  async function handlePromo(code) {
    try {
      const res = await API.promo(token, code)
      notify(`Промокод +${res.added} 🧢!`, 'accent2')
      await refreshAll()
    } catch (e) {
      let msg = e.message
      if (msg.includes('already')) msg = 'Промокод уже активирован'
      if (msg.lower?.includes('invalid') || msg.includes('Invalid')) msg = 'Неверный промокод'
      notify(msg, 'accent3')
    }
  }

  function openCaseDetail(id){ navigate(`/case/${id}`) }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight cursor-pointer" onClick={()=>navigate('/')} title="На главную">
          <span className="text-accent1">Gifts</span> <span className="text-accent2">Battle</span>
        </h1>
        <div className="text-right">
          <div className="text-subt text-sm">Баланс</div>
          <div className="text-2xl font-bold">{balance} 🧢</div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CasesList cases={cases} onOpen={openCaseDetail} />
              </Card>
              <Card>
                <PromoInput onActivate={handlePromo} />
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <Inventory items={inventory} onSell={handleSell} onWithdraw={handleWithdraw} />
              </Card>
              <Card>
                <Leaders leaders={leaders} meId={user?.id} />
              </Card>
            </div>
          </div>
        } />
        <Route path="/case/:id" element={
          <CaseDetail
            getCases={()=>API.cases(token)}
            // "Открыть" всегда платное -> free=false
            openCase={(id)=>API.openCase(token, id, false)}
            onAfterOpen={async()=>{ await refreshAll() }}
            notify={notify}
          />
        } />
      </Routes>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-3xl bg-${toast.tone} text-white shadow-glow`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
