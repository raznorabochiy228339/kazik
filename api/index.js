const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const axios = require('axios')
const db = require('./db')
const settings = require('../settings.json')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Simple auth: send { telegram_id }
// In production use Telegram login widget (out of scope)
app.post('/api/auth', async (req,res)=>{
  const { telegram_id } = req.body
  if(!telegram_id) return res.status(400).json({ error: 'telegram_id required' })
  let user = db.getUserByTelegramId(telegram_id)
  if(!user) {
    user = db.createUser({telegram_id, balance:1000})
  }
  res.json({ user })
})

app.get('/api/me/:telegram_id', (req,res)=>{
  const { telegram_id } = req.params
  const user = db.getUserByTelegramId(Number(telegram_id))
  if(!user) return res.status(404).json({ error: 'not found' })
  const inventory = db.getInventory(user.id)
  res.json({ user, inventory })
})

// Cases
app.get('/api/cases', (req,res)=>{
  const cases = settings.cases
  res.json({ cases })
})

function weightedPick(items){
  const total = items.reduce((s,i)=>s+i.chance,0)
  const r = Math.random()*total
  let acc=0
  for(const it of items){
    acc+=it.chance
    if(r<=acc) return it
  }
  return items[items.length-1]
}

app.post('/api/cases/:id/open', (req,res)=>{
  const id = Number(req.params.id)
  const mode = req.query.mode || 'normal'
  const { telegram_id } = req.body
  const conf = settings.cases.find(c=>c.id===id)
  if(!conf) return res.status(404).json({ error:'case not found' })
  const user = db.getUserByTelegramId(telegram_id)
  if(!user) return res.status(404).json({ error:'user not found' })
  if(user.balance < conf.price) return res.status(400).json({ error:'insufficient balance' })
  db.changeBalance(user.id, -conf.price)
  const item = weightedPick(conf.items)
  // add NFT to inventory
  const nft = db.addNFT(user.id, { case_id: id, item_id: item.id, name: item.name, price: item.price, rarity: item.rarity })
  // record history
  db.addCaseHistory({ user_id: user.id, case_id: id, item_id: item.id, price: item.price, timestamp: Date.now() })
  res.json({ item, nft, mode })
})

// Inventory actions
app.post('/api/inventory/:nftId/sell', (req,res)=>{
  const nftId = Number(req.params.nftId)
  const { telegram_id } = req.body
  const user = db.getUserByTelegramId(telegram_id)
  if(!user) return res.status(404).json({ error:'user not found' })
  const nft = db.getNFT(nftId)
  if(!nft || nft.owner_id !== user.id) return res.status(404).json({ error:'nft not found' })
  db.deleteNFT(nftId)
  db.changeBalance(user.id, nft.price)
  res.json({ ok:true, gained: nft.price })
})

app.post('/api/inventory/:nftId/withdraw', async (req,res)=>{
  const nftId = Number(req.params.nftId)
  const { telegram_id } = req.body
  const user = db.getUserByTelegramId(telegram_id)
  if(!user) return res.status(404).json({ error:'user not found' })
  const nft = db.getNFT(nftId)
  if(!nft || nft.owner_id !== user.id) return res.status(404).json({ error:'nft not found' })
  // mark withdrawal request
  db.requestWithdraw(nftId)
  // notify admins
  const admins = settings.admins || []
  const token = settings.telegram_bot_token
  for(const adminId of admins){
    if(token && token !== 'YOUR_TELEGRAM_BOT_TOKEN'){
      try{
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: adminId,
          text: `Withdraw request\nUser: ${user.telegram_id}\nNFT: ${nft.name}\nPrice: ${nft.price}\nNFT ID: ${nft.id}`
        })
      }catch(e){
        console.error('tg notify failed', e.message)
      }
    }else{
      console.log('TG token not set, skipping telegram notify. Admin would be:', adminId)
    }
  }
  res.json({ ok:true })
})

// Admin endpoints
app.get('/api/admin/users', (req,res)=>{
  const users = db.getAllUsers()
  res.json({ users })
})

app.get('/api/admin/withdrawals', (req,res)=>{
  const list = db.getWithdrawRequests()
  res.json({ list })
})

app.post('/api/admin/withdrawals/:nftId/confirm', (req,res)=>{
  const nftId = Number(req.params.nftId)
  const nft = db.getNFT(nftId)
  if(!nft) return res.status(404).json({ error:'nft not found' })
  db.confirmWithdraw(nftId)
  res.json({ ok:true })
})

// Crash game endpoints
app.post('/api/crash/start', (req,res)=>{
  const { telegram_id, bet } = req.body
  const user = db.getUserByTelegramId(telegram_id)
  if(!user) return res.status(404).json({ error:'user not found' })
  if(bet <= 0 || user.balance < bet) return res.status(400).json({ error:'invalid bet' })
  db.changeBalance(user.id, -bet)
  // generate round
  const roundId = db.createCrashRound({ user_id:user.id, bet, start:Date.now() })
  res.json({ ok:true, roundId })
})

app.post('/api/crash/cashout', (req,res)=>{
  const { telegram_id, roundId } = req.body
  const user = db.getUserByTelegramId(telegram_id)
  if(!user) return res.status(404).json({ error:'user not found' })
  const round = db.getCrashRound(roundId)
  if(!round) return res.status(404).json({ error:'round not found' })
  if(round.user_id !== user.id) return res.status(403).json({ error:'not owner' })
  if(round.status !== 'running') return res.status(400).json({ error:'round not running' })
  // cashout at current multiplier (simulate quick)
  const multiplier = db.getCurrentMultiplierForRound(round)
  const win = Math.floor(round.bet * multiplier)
  db.finishCrashRound(roundId, { status:'cashed', cashout_multiplier: multiplier, win })
  db.changeBalance(user.id, win)
  res.json({ ok:true, win, multiplier })
})

// serve frontend static if built
const dist = path.join(__dirname, '..', 'dist')
if(fs.existsSync(dist)){
  app.use(express.static(dist))
  app.get('*',(req,res)=>res.sendFile(path.join(dist,'index.html')))
} else {
  app.get('/', (req,res)=>res.send('Frontend not built. Run npm run build'))
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log('Server started on', PORT))
