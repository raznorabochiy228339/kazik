const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(__dirname, '..', 'data.db'))
// init tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE,
  balance INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER,
  case_id INTEGER,
  item_id INTEGER,
  name TEXT,
  price INTEGER,
  rarity TEXT,
  withdraw_requested INTEGER DEFAULT 0,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS case_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  case_id INTEGER,
  item_id INTEGER,
  price INTEGER,
  timestamp INTEGER
);
CREATE TABLE IF NOT EXISTS crash_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  bet INTEGER,
  status TEXT,
  start INTEGER,
  end INTEGER,
  cashout_multiplier REAL,
  win INTEGER
);
`)

module.exports = {
  getUserByTelegramId: (telegram_id) => {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id)
  },
  createUser: ({telegram_id,balance=0})=>{
    const info = db.prepare('INSERT INTO users (telegram_id,balance) VALUES (?,?)').run(telegram_id,balance)
    return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
  },
  changeBalance: (userId, delta)=>{
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(delta, userId)
  },
  addNFT: (owner_id, obj)=>{
    const now = Date.now()
    const info = db.prepare('INSERT INTO nfts (owner_id,case_id,item_id,name,price,rarity,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(owner_id, obj.case_id, obj.item_id, obj.name, obj.price, obj.rarity, now)
    return db.prepare('SELECT * FROM nfts WHERE id = ?').get(info.lastInsertRowid)
  },
  getInventory: (userId)=> {
    return db.prepare('SELECT * FROM nfts WHERE owner_id = ?').all(userId)
  },
  getNFT: (id)=> db.prepare('SELECT * FROM nfts WHERE id = ?').get(id),
  deleteNFT: (id)=> db.prepare('DELETE FROM nfts WHERE id = ?').run(id),
  requestWithdraw: (id)=> db.prepare('UPDATE nfts SET withdraw_requested = 1 WHERE id = ?').run(id),
  confirmWithdraw: (id)=> db.prepare('DELETE FROM nfts WHERE id = ?').run(id),
  addCaseHistory: (obj)=> db.prepare('INSERT INTO case_history (user_id,case_id,item_id,price,timestamp) VALUES (?,?,?,?,?)')
    .run(obj.user_id,obj.case_id,obj.item_id,obj.price,obj.timestamp),
  getAllUsers: ()=> db.prepare('SELECT * FROM users').all(),
  getWithdrawRequests: ()=> db.prepare('SELECT * FROM nfts WHERE withdraw_requested = 1').all(),
  // Crash helpers
  createCrashRound: ({user_id, bet, start})=>{
    const info = db.prepare('INSERT INTO crash_rounds (user_id,bet,status,start) VALUES (?,?,?,?)').run(user_id,bet,'running',start)
    return info.lastInsertRowid
  },
  getCrashRound: (id)=> db.prepare('SELECT * FROM crash_rounds WHERE id = ?').get(id),
  finishCrashRound: (id, obj)=> db.prepare('UPDATE crash_rounds SET status = ?, end = ?, cashout_multiplier = ?, win = ? WHERE id = ?')
    .run(obj.status, Date.now(), obj.cashout_multiplier || null, obj.win || 0, id),
  getCurrentMultiplierForRound: (round)=>{
    // simple deterministic pseudo-random based on start time and id
    const seed = (round.id * 9301 + round.start) % 233280
    // prefer short runs: generate multiplier between 0.5 and 8.0 with heavier weight on small numbers
    const r = (seed % 1000) / 1000
    const multiplier = 0.5 + Math.pow(r, 2) * 8 // squares -> favors smaller values
    return Math.max(0.5, Number(multiplier.toFixed(2)))
  }
}
