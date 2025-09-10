from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import secrets, random, json, os, time

SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "settings.json")
with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
    SETTINGS = json.load(f)

ADMIN_API_KEY = SETTINGS.get("ADMIN_API_KEY", "")

app = FastAPI(title="Gifts Battle API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Models & Storage ----------------
class Item(BaseModel):
    id: int
    name: str
    emoji: str
    value_caps: int
    case_id: int
    rarity: str
    status: str = "owned"  # owned | withdraw_requested | withdraw_processed
    requested_at: Optional[float] = None
    processed_at: Optional[float] = None

class User(BaseModel):
    id: int
    username: str
    balance_caps: int = 0
    inventory: List[Item] = Field(default_factory=list)
    used_promos: List[str] = Field(default_factory=list)
    free_opens: Dict[int, bool] = Field(default_factory=dict)

class Case(BaseModel):
    id: int
    slug: str
    name: str
    price_caps: int
    icon: Optional[str] = None
    items: List[Dict[str, Any]]

USERS: Dict[int, User] = {}
SESSIONS: Dict[str, int] = {}
CASES: Dict[int, Case] = {}
PROMOS: Dict[str, int] = SETTINGS.get("promocodes", {})

ITEM_AUTO_ID = 1
USER_AUTO_ID = 1

def _load_cases():
    for c in SETTINGS.get("cases", []):
        CASES[c["id"]] = Case(**c)

_load_cases()

def auth_required(authorization: Optional[str] = Header(None)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    user_id = SESSIONS.get(token)
    if not user_id or user_id not in USERS:
        raise HTTPException(status_code=401, detail="Invalid session")
    return USERS[user_id]

def admin_required(request: Request):
    key = request.headers.get("X-Admin-Key", "")
    if key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Admin unauthorized")

def weighted_choice(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    weights = [i["weight"] for i in items]
    return random.choices(items, weights=weights, k=1)[0]

def next_item_id() -> int:
    global ITEM_AUTO_ID
    iid = ITEM_AUTO_ID
    ITEM_AUTO_ID += 1
    return iid

def create_user(username: str) -> User:
    global USER_AUTO_ID
    uid = USER_AUTO_ID
    USER_AUTO_ID += 1
    user = User(id=uid, username=username, balance_caps=200)
    USERS[uid] = user
    return user

# ---------------- Schemas ----------------
class AuthBody(BaseModel):
    initData: Optional[str] = ""
    username: Optional[str] = None

class AuthResponse(BaseModel):
    session_token: str

class UserOut(BaseModel):
    id: int
    username: str
    balance_caps: int

class CaseOut(BaseModel):
    id: int
    slug: str
    name: str
    price_caps: int
    icon: Optional[str] = None
    items_preview: List[Dict[str, Any]]

class OpenCaseBody(BaseModel):
    free: bool = False

class OpenCaseResponse(BaseModel):
    item: Item
    balance_caps: int

class SellBody(BaseModel):
    item_id: int

class WithdrawBody(BaseModel):
    item_id: int

class PromoBody(BaseModel):
    code: str

# ---------------- Endpoints ----------------
@app.post("/auth", response_model=AuthResponse)
def auth(body: AuthBody):
    username = (body.username or "Guest")[:32]
    user = create_user(username=username)
    token = secrets.token_urlsafe(24)
    SESSIONS[token] = user.id
    return AuthResponse(session_token=token)

@app.get("/users/me", response_model=UserOut)
def get_me(user: User = Depends(auth_required)):
    return UserOut(id=user.id, username=user.username, balance_caps=user.balance_caps)

@app.get("/cases", response_model=List[CaseOut])
def get_cases(user: User = Depends(auth_required)):
    out = []
    for c in CASES.values():
        out.append(CaseOut(
            id=c.id, slug=c.slug, name=c.name, price_caps=c.price_caps, icon=c.icon,
            items_preview=[{"name": i["name"], "emoji": i["emoji"], "rarity": i["rarity"], "value_caps": i["value_caps"]} for i in c.items]
        ))
    return out

@app.post("/cases/{case_id}/open", response_model=OpenCaseResponse)
def open_case(case_id: int, body: OpenCaseBody, user: User = Depends(auth_required)):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    case = CASES[case_id]

    cost = 0 if body.free else case.price_caps
    if cost > 0 and user.balance_caps < cost:
        raise HTTPException(status_code=400, detail="Not enough balance")
    if cost > 0:
        user.balance_caps -= cost

    win = weighted_choice(case.items)
    item = Item(
        id=next_item_id(),
        name=win["name"],
        emoji=win["emoji"],
        value_caps=win["value_caps"],
        case_id=case.id,
        rarity=win["rarity"],
    )
    user.inventory.append(item)
    return OpenCaseResponse(item=item, balance_caps=user.balance_caps)

@app.get("/inventory", response_model=List[Item])
def get_inventory(user: User = Depends(auth_required)):
    return user.inventory

@app.post("/inventory/sell")
def sell_item(body: SellBody, user: User = Depends(auth_required)):
    idx = next((i for i, it in enumerate(user.inventory) if it.id == body.item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Item not found")
    if user.inventory[idx].status != "owned":
        raise HTTPException(status_code=400, detail="Item not sellable")
    value = user.inventory[idx].value_caps
    user.inventory.pop(idx)
    user.balance_caps += value
    return {"balance_caps": user.balance_caps}

@app.post("/inventory/withdraw_request")
def withdraw_request(body: WithdrawBody, user: User = Depends(auth_required)):
    it = next((it for it in user.inventory if it.id == body.item_id), None)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    if it.status != "owned":
        raise HTTPException(status_code=400, detail="Already requested or processed")
    it.status = "withdraw_requested"
    it.requested_at = time.time()
    return {"status": it.status, "item_id": it.id}

# -------- Admin endpoints (protected by X-Admin-Key) --------
@app.get("/admin/withdraws")
def admin_list_withdraws(request: Request, status: str = "withdraw_requested"):
    admin_required(request)
    out = []
    for u in USERS.values():
        for it in u.inventory:
            if it.status == status:
                out.append({"user_id": u.id, "username": u.username, "item": it.dict()})
    return out

@app.post("/admin/withdraws/process/{item_id}")
def admin_process_withdraw(item_id: int, request: Request):
    admin_required(request)
    # find item in any user
    for u in USERS.values():
        for it in u.inventory:
            if it.id == item_id:
                if it.status != "withdraw_requested":
                    raise HTTPException(status_code=400, detail="Item not pending")
                it.status = "withdraw_processed"
                it.processed_at = time.time()
                return {"ok": True, "user_id": u.id, "item_id": it.id}
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/leaders")
def leaders(user: User = Depends(auth_required)):
    top = sorted(USERS.values(), key=lambda u: u.balance_caps, reverse=True)[:50]
    return [
        {"id": u.id, "username": u.username, "balance_caps": u.balance_caps, "items": len(u.inventory)}
        for u in top
    ]

@app.post("/promocode/activate")
def promo_activate(body: PromoBody, user: User = Depends(auth_required)):
    code = body.code.strip().upper()
    if code not in PROMOS:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    if code in user.used_promos:
        raise HTTPException(status_code=400, detail="Promo already used")
    amount = PROMOS[code]
    user.balance_caps += amount
    user.used_promos.append(code)
    return {"balance_caps": user.balance_caps, "added": amount, "code": code}
