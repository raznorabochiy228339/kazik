// server.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
// сюда проксируем API бэкенда (локально в контейнере бек будет на 8000)
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:8000';

// Proxy: все /api/* -> Python backend
app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  logLevel: 'warn'
}));

// Serve frontend build
const dist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(dist));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static server + proxy listening on ${PORT}, proxy -> ${API_TARGET}`);
});
