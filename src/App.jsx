import React, {useState, useEffect} from 'react'

function Nav({user, setUser}) {
  return <nav className="p-4 border-b flex gap-4">
    <div className="font-bold">Telega NFT Cases</div>
    <div className="flex-1" />
    <div>Balance: {user ? user.balance : '—'}</div>
  </nav>
}

function Login({onLogin}) {
  const [id, setId] = useState('')
  return <div className="p-4">
    <h2 className="text-xl mb-2">Login with Telegram ID</h2>
    <input value={id} onChange={e=>setId(e.target.value)} className="border p-2 mr-2" placeholder="Telegram ID" />
    <button onClick={()=>onLogin(id)} className="bg-blue-600 text-white px-3 py-2 rounded">Login</button>
  </div>
}

function Home({user, setView}) {
  return <div className="p-4 grid gap-4">
    <div className="text-lg">Welcome! Balance: {user.balance}</div>
    <div className="flex gap-2">
      <button onClick={()=>setView('cases')} className="btn">Кейсы</button>
      <button onClick={()=>setView('inventory')} className="btn">Инвентарь</button>
      <button onClick={()=>setView('crash')} className="btn">Crash</button>
    </div>
  </div>
}

function Cases({setView, user}) {
  const [cases, setCases] = useState([])
  useEffect(()=>fetch('/api/cases').then(r=>r.json()).then(d=>setCases(d.cases)),[])
  return <div className="p-4">
    <h2 className="text-xl mb-2">Кейсы</h2>
    <div className="grid gap-3">
      {cases.map(c=>(
        <div key={c.id} className="p-3 border rounded flex justify-between items-center">
          <div>
            <div className="font-bold">{c.emoji} {c.name}</div>
            <div>Цена: {c.price}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setView('case:'+c.id)} className="btn">Открыть</button>
            <button onClick={async ()=>{ // fast open
              const res = await fetch(`/api/cases/${c.id}/open?mode=fast`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id})})
              const data = await res.json()
              alert('Получено: '+data.item.name)
            }} className="btn">Быстро</button>
          </div>
        </div>
      ))}
    </div>
  </div>
}

function CasePage({id, user}) {
  const [info, setInfo] = useState(null)
  useEffect(()=>fetch('/api/cases').then(r=>r.json()).then(d=>setInfo(d.cases.find(x=>x.id===Number(id)))),[])
  if(!info) return <div>Loading...</div>
  const open = async (mode) => {
    const res = await fetch(`/api/cases/${id}/open?mode=${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id})})
    const data = await res.json()
    if(mode==='normal') {
      // simple fake animation
      alert('Анимация... Получено: '+data.item.name)
    } else {
      alert('Быстро: '+data.item.name)
    }
  }
  return <div className="p-4">
    <h2 className="text-xl">{info.emoji} {info.name}</h2>
    <div>Цена: {info.price}</div>
    <div className="mt-2 flex gap-2">
      <button onClick={()=>open('normal')} className="btn">Открыть</button>
      <button onClick={()=>open('fast')} className="btn">Быстро</button>
    </div>
    <div className="mt-4">
      <h3 className="font-bold">Предметы</h3>
      <ul>
        {info.items.map(it=> <li key={it.id}>{it.name} — {it.rarity} — {it.price} — {it.chance}%</li>)}
      </ul>
    </div>
  </div>
}

function Inventory({user}) {
  const [items, setItems] = useState([])
  useEffect(()=>fetch(`/api/me/${user.telegram_id}`).then(r=>r.json()).then(d=>setItems(d.inventory)),[])
  const sell = async (id)=> {
    const res = await fetch(`/api/inventory/${id}/sell`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id})})
    const data = await res.json()
    alert('Продано, получено: '+data.gained)
    setItems(items.filter(i=>i.id!==id))
  }
  const withdraw = async (id)=>{
    await fetch(`/api/inventory/${id}/withdraw`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id})})
    alert('Запрошен вывод. Ожидает подтверждения админа.')
  }
  return <div className="p-4">
    <h2 className="text-xl mb-2">Инвентарь</h2>
    <div className="grid gap-2">
      {items.map(it=>(
        <div key={it.id} className="p-2 border rounded flex justify-between">
          <div>{it.name} — {it.rarity} — {it.price}</div>
          <div className="flex gap-2">
            <button onClick={()=>sell(it.id)} className="btn">Продать</button>
            <button onClick={()=>withdraw(it.id)} className="btn">Вывести</button>
          </div>
        </div>
      ))}
    </div>
  </div>
}

function Crash({user}) {
  const [bet, setBet] = useState(100)
  const [round, setRound] = useState(null)
  const start = async ()=>{
    const res = await fetch('/api/crash/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id, bet})})
    const data = await res.json()
    if(data.roundId) setRound({id:data.roundId, started:true})
  }
  const cashout = async ()=>{
    if(!round) return
    const res = await fetch('/api/crash/cashout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:user.telegram_id, roundId:round.id})})
    const data = await res.json()
    alert('Выигрыш: '+data.win+' (x'+data.multiplier+')')
    setRound(null)
  }
  return <div className="p-4">
    <h2 className="text-xl mb-2">Crash (Самолётик)</h2>
    <div className="mb-2">Ставка:
      <input value={bet} onChange={e=>setBet(Number(e.target.value))} className="border ml-2 p-1" />
    </div>
    {!round && <button onClick={start} className="btn">Старт</button>}
    {round && <button onClick={cashout} className="btn">Забрать</button>}
  </div>
}

function Admin({user}) {
  const [users, setUsers] = useState([])
  const [withdraws, setWithdraws] = useState([])
  useEffect(()=>fetch('/api/admin/users').then(r=>r.json()).then(d=>setUsers(d.users)),[])
  useEffect(()=>fetch('/api/admin/withdrawals').then(r=>r.json()).then(d=>setWithdraws(d.list)),[])
  if(!user) return null
  return <div className="p-4">
    <h2 className="text-xl">Admin Panel</h2>
    <h3 className="mt-2">Users</h3>
    <ul>{users.map(u=> <li key={u.id}>{u.telegram_id} — {u.balance}</li>)}</ul>
    <h3 className="mt-2">Withdraw requests</h3>
    <ul>{withdraws.map(w=> <li key={w.id}>NFT {w.id} — {w.name} — owner {w.owner_id}
      <button onClick={async ()=>{
        await fetch(`/api/admin/withdrawals/${w.id}/confirm`,{method:'POST'})
        alert('Confirmed')
      }} className="btn ml-2">Confirm</button>
    </li>)}</ul>
  </div>
}

export default function App(){
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home')
  useEffect(()=>{
    const saved = localStorage.getItem('tg_user')
    if(saved) setUser(JSON.parse(saved))
  },[])
  const onLogin = async (telegram_id)=>{
    const res = await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegram_id:Number(telegram_id)})})
    const data = await res.json()
    setUser(data.user)
    localStorage.setItem('tg_user', JSON.stringify(data.user))
  }
  useEffect(()=>{ if(user) setView('home') },[user])
  const isAdmin = user && [/* will be validated server-side */].includes(user.telegram_id)
  return <div>
    <Nav user={user}/>
    <div className="container mx-auto">
      {!user && <Login onLogin={onLogin} />}
      {user && view==='home' && <Home user={user} setView={setView} />}
      {user && view==='cases' && <Cases setView={setView} user={user} />}
      {user && String(view).startsWith('case:') && <CasePage id={String(view).split(':')[1]} user={user} />}
      {user && view==='inventory' && <Inventory user={user} />}
      {user && view==='crash' && <Crash user={user} />}
      {user && (settingsIsAdmin(user.telegram_id()) ) && <Admin user={user} />}
    </div>
  </div>
}

function settingsIsAdmin(tid){
  try{
    // check client-side (not authoritative)
    const s = fetch('/settings.json').then(r=>r.json())
    return false
  }catch(e){ return false }
}
