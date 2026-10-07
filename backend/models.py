"""All Pydantic / PydanticAI types for the Campus Customs backend (API, auth, agent)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 1000
MAX_HISTORY_TURNS = 20
MAX_PRODUCT_CARDS = 6


# ---------- Catalogue (Problem 3) ----------


class SizeStock(BaseModel):
    size: str
    quantity: int


class ProductSummary(BaseModel):
    product_id: str
    name: str
    garment_type: str
    description: str
    price: float
    image_url: str
    in_stock: bool


class ProductDetail(ProductSummary):
    colors: list[str]
    search_tags: list[str]
    inventory: list[SizeStock]


# ---------- Accounts (Problem 4) ----------


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)
    confirm_password: str = Field(max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class UserPublic(BaseModel):
    """What the front end (and the agent) may see about a user. Never includes the hash."""

    id: int
    first_name: str | None
    last_name: str | None
    name: str
    email: str


# ---------- Chat API (Problem 5) ----------


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    """What the website's chat widget sends to POST /api/chat."""

    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: list[ChatTurn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)


class ProductCard(BaseModel):
    """A product shown next to the chat reply. Built from the database, never from model text."""

    product_id: str
    name: str
    price: float
    image_url: str
    in_stock: bool
    sizes_in_stock: list[str]


class ChatResponse(BaseModel):
    """What POST /api/chat returns to the website."""

    reply: str
    products: list[ProductCard]


# ---------- Agent (Problem 5) ----------


@dataclass
class ShopDeps:
    """Per-request context handed to the agent and its tools."""

    shopper_first_name: str | None = None


class ProductMatch(BaseModel):
    """One search hit returned by the search_products tool."""

    product_id: str
    name: str
    garment_type: str
    colors: list[str]
    price: float
    total_in_stock: int
    sizes_in_stock: list[str]


class AgentReply(BaseModel):
    """The agent's structured final answer."""

    reply: str = Field(description="Your message to the shopper, in plain text (no Markdown).")
    product_ids: list[str] = Field(
        default_factory=list,
        max_length=MAX_PRODUCT_CARDS,
        description=(
            "product_id values, copied exactly from tool results, of the items your reply recommends or "
            "discusses. The website shows these as product cards. Empty if no specific product fits."
        ),
    )
