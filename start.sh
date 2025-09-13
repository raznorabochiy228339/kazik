#!/usr/bin/env bash
set -e

# стартуем Python backend, если есть backend/main.py
if [ -f backend/main.py ]; then
  echo "Starting Python backend..."
  # запускаем в фоне
  python3 backend/main.py &
  # даём 1 секунду на поднятие
  sleep 1
else
  echo "No backend/main.py found, skipping Python backend start."
fi

# Запускаем Node static server (проверяет frontend/dist)
echo "Starting Node static server..."
node server.js
