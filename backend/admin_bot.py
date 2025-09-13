"""
Telegram admin bot for handling withdraw requests.
Requires python-telegram-bot v20+. Installs: pip install python-telegram-bot==20.3
Config: backend/settings.json -> ADMIN_BOT_TOKEN, ADMIN_API_KEY
Run: python admin_bot.py
"""
import json, os, asyncio, aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler

SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "settings.json")
with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
    SETTINGS = json.load(f)

ADMIN_BOT_TOKEN = SETTINGS["ADMIN_BOT_TOKEN"]
ADMIN_API_KEY = SETTINGS["ADMIN_API_KEY"]
API_BASE = os.environ.get("API_BASE", "http://localhost:8000")

async def fetch_withdraws(session):
    async with session.get(f"{API_BASE}/admin/withdraws", headers={"X-Admin-Key": ADMIN_API_KEY}) as r:
        return await r.json()

async def process_withdraw(session, item_id: int):
    async with session.post(f"{API_BASE}/admin/withdraws/process/{item_id}", headers={"X-Admin-Key": ADMIN_API_KEY}) as r:
        return await r.json()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Админ-бот: /pending — список запросов на вывод")

async def pending(update: Update, context: ContextTypes.DEFAULT_TYPE):
    async with aiohttp.ClientSession() as session:
        data = await fetch_withdraws(session)
    if not data:
        await update.message.reply_text("Нет запросов на вывод.")
        return
    for req in data[:20]:
        it = req["item"]
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("✅ Выдать", callback_data=f"process:{it['id']}")]])
        text = f"User: {req['username']} (id {req['user_id']})\n" \
               f"Item #{it['id']}: {it['emoji']} {it['name']} ({it['rarity']}, {it['value_caps']} 🧢)"
        await update.message.reply_text(text, reply_markup=kb)

async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if q.data.startswith("process:"):
        item_id = int(q.data.split(":")[1])
        async with aiohttp.ClientSession() as session:
            res = await process_withdraw(session, item_id)
        if res.get("ok"):
            await q.edit_message_text(q.message.text + "\n\nОбработано ✅")
        else:
            await q.edit_message_text(q.message.text + f"\n\nОшибка: {res}")

def main():
    app = Application.builder().token(ADMIN_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("pending", pending))
    app.add_handler(CallbackQueryHandler(on_callback))
    app.run_polling()

if __name__ == "__main__":
    main()
