// index.js
import express from 'express';
import { openDB } from './db.js';

const app = express();
app.use(express.json());

let db;

// Инициализация базы и запуск сервера
(async () => {
  try {
    db = await openDB();

    // Пример GET-запроса для получения всех пользователей
    app.get('/users', async (req, res) => {
      const users = await db.all('SELECT * FROM users');
      res.json(users);
    });

    // Пример POST-запроса для добавления пользователя
    app.post('/users', async (req, res) => {
      const { telegram_id, balance } = req.body;
      try {
        const result = await db.run(
          'INSERT INTO users (telegram_id, balance) VALUES (?, ?)',
          telegram_id,
          balance || 0
        );
        res.json({ id: result.lastID });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
})();
