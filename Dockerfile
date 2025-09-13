# Dockerfile
FROM node:18-bullseye AS build-node
WORKDIR /app
# Копируем package.json & package-lock (frontend) и ставим зависимости
COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim AS base
WORKDIR /app

# Установим полезные пакеты и node для server.js
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates build-essential && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs

# Копируем собранный фронтенд из стадии build-node
COPY --from=build-node /app/frontend/dist ./frontend/dist
COPY --from=build-node /app/frontend/package.json ./frontend/package.json

# Копируем весь проект (включая backend/)
COPY . .

# Установим python deps (если есть requirements.txt), иначе ставим минимально uvicorn/fastapi
RUN if [ -f backend/requirements.txt ]; then pip install -r backend/requirements.txt; else pip install uvicorn fastapi starlette; fi

# Установим node-зависимости для server.js
RUN npm install express http-proxy-middleware

# Разрешаем запуск start.sh
RUN chmod +x ./start.sh

ENV PORT 10000
EXPOSE 10000

CMD ["./start.sh"]
