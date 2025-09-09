
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/data.sqlite');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, balance INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, item_name TEXT, item_price INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS promocodes (code TEXT PRIMARY KEY, used_by TEXT)");
});

module.exports = db;
