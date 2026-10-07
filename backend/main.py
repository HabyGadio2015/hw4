"""Campus Customs backend (FastAPI).

Problem 3: read-only product catalogue, stock by size, and product images.
Problem 4: accounts and login (auth.py).
Problem 5: POST /api/chat → the PydanticAI shop agent (agent.py, tools.py, models.py, prompts/prompt.md).

Run from the backend/ folder (with the .venv activated):
    uvicorn main:app --reload --port 8000
"""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import agent
import audit
import guard
import memory
from auth import current_user, router as auth_router
from models import AuditEntry, ChatHistoryItem, ChatRequest, ChatResponse, ProductDetail, ProductSummary
from tools import PRODUCTS_DIR, fetch_product_detail, list_product_summaries

logger = logging.getLogger("campus_customs")
if not logger.handlers:  # show the per-chat usage line in the server console
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)

app = FastAPI(title="Campus Customs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth_router)

# Serve only the product images folder, never the whole data/ folder (the DB lives there).
app.mount("/media/products", StaticFiles(directory=PRODUCTS_DIR), name="product-images")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/products", response_model=list[ProductSummary])
def list_products() -> list[ProductSummary]:
    return list_product_summaries()


@app.get("/api/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str) -> ProductDetail:
    product = fetch_product_detail(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/api/chat/history", response_model=list[ChatHistoryItem])
def chat_history(request: Request) -> list[ChatHistoryItem]:
    user = current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Log in to see your saved chat.")
    return memory.load_history(user.id)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, request: Request) -> ChatResponse:
    user = current_user(request)  # optional: logged-in shoppers get memory and personalization
    # Card numbers, SSNs, and passwords never reach the model or the saved chat history.
    if guard.contains_sensitive(body.message):
        audit.record(AuditEntry(time=audit.now_iso(), user=f"user:{user.id}" if user else "guest", stop_reason="guard_blocked"))
        return ChatResponse(reply=guard.SENSITIVE_REPLY, products=[])
    # A logged-in shopper's history comes from the database, not from the browser, so it can't be spoofed.
    history = memory.recent_turns(user.id) if user else body.history
    try:
        response = await agent.chat(body.message, history, user=user, page=body.page)
    except Exception:
        # Log details server-side only; never send stack traces or keys to the browser.
        logger.exception("Chat agent failed")
        raise HTTPException(
            status_code=502,
            detail="Sorry, our assistant is having trouble right now. Please try again in a moment.",
        )
    if user:
        memory.save_exchange(user.id, body.message, response.reply, response.products)
    return response
