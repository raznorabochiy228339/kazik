# ---------- Build frontend ----------
FROM node:18 AS build-node
WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm ci --silent

# Копируем весь фронт (он у тебя в корне)
COPY . .

# Собираем Vite
RUN npm run build


# ---------- Backend ----------
FROM python:3.11-slim AS base
WORKDIR /app

# Копируем backend
COPY backend/ ./backend/

# Копируем собранный фронт
COPY --from=build-node /app/dist ./frontend/dist

# Устанавливаем зависимости Python
RUN pip install --no-cache-dir -r backend/requirements.txt

# Запуск FastAPI через uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
