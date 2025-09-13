// db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Функция открытия базы данных
export async function openDB() {
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database
  });

  // Создание таблицы users, если она не существует
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE,
      balance INTEGER DEFAULT 0
    );
  `);

  return db;
}
