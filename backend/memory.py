"""Customer memory: saves a logged-in shopper's chat in the chat_messages table and reloads it.

Table chat_messages(id, user_id -> users.id, role, content, products_json, created_at).
products_json holds the cards shown with an assistant reply; on reload only the product ids are used and the
cards are rebuilt from the catalogue, so a returning shopper always sees current prices and stock.
"""

import json
import sqlite3

from models import MAX_HISTORY_TURNS, ChatHistoryItem, ChatTurn, ProductCard
from tools import DB_PATH, product_cards

HISTORY_LIMIT = 50  # most recent messages sent back to the website


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)  # read-write; this module only touches chat_messages
    conn.row_factory = sqlite3.Row
    return conn


def _recent_rows(user_id: int, limit: int) -> list[sqlite3.Row]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT role, content, products_json FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return rows[::-1]  # oldest first


def save_exchange(user_id: int, user_message: str, reply: str, cards: list[ProductCard]) -> None:
    """Store the shopper's message and the assistant's reply (with its product cards) for this user only."""
    with _connect() as conn:
        conn.execute("INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)", (user_id, user_message))
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content, products_json) VALUES (?, 'assistant', ?, ?)",
            (user_id, reply, json.dumps([c.model_dump() for c in cards]) if cards else None),
        )


def recent_turns(user_id: int) -> list[ChatTurn]:
    """The last turns, as the agent's conversation history (text only)."""
    return [ChatTurn(role=r["role"], content=r["content"][:4000]) for r in _recent_rows(user_id, MAX_HISTORY_TURNS)]


def load_history(user_id: int) -> list[ChatHistoryItem]:
    """The saved conversation for the chat widget, with product cards rebuilt from the catalogue."""
    items = []
    for r in _recent_rows(user_id, HISTORY_LIMIT):
        cards: list[ProductCard] = []
        if r["role"] == "assistant" and r["products_json"]:
            try:
                raw = json.loads(r["products_json"])
            except ValueError:
                raw = []
            cards = product_cards([d["product_id"] for d in raw if isinstance(d, dict) and "product_id" in d])
        items.append(ChatHistoryItem(role=r["role"], content=r["content"], products=cards))
    return items
