"""All Pydantic / PydanticAI types for the Campus Customs backend (API, auth, agent)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 1000
MAX_HISTORY_TURNS = 20
MAX_PRODUCT_CARDS = 12


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


class PageContext(BaseModel):
    """Where the shopper is on the site. Sent by the chat widget with every message."""

    path: str = Field(max_length=200)
    product_id: str | None = Field(default=None, max_length=120, description="Set on a single-item page.")


class ChatRequest(BaseModel):
    """What the website's chat widget sends to POST /api/chat."""

    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: list[ChatTurn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)
    page: PageContext | None = None


class ProductCard(BaseModel):
    """A product shown next to the chat reply. Built from the database, never from model text."""

    product_id: str
    name: str
    garment_type: str
    short_info: str
    colors: list[str]
    price: float
    image_url: str
    in_stock: bool
    sizes_in_stock: list[str]


class ChatResponse(BaseModel):
    """What POST /api/chat returns to the website."""

    reply: str
    results_title: str | None = None  # heading for the cards on the page, e.g. "Hoodies"
    products: list[ProductCard]


class ChatHistoryItem(BaseModel):
    """One saved message returned by GET /api/chat/history."""

    role: Literal["user", "assistant"]
    content: str
    products: list[ProductCard] = Field(default_factory=list)


# ---------- Agent (Problem 5) ----------


@dataclass
class ShopDeps:
    """Per-request context handed to the agent and its tools (Problem 8: who is chatting, and where)."""

    user: UserPublic | None = None  # the logged-in shopper (never includes the password hash)
    page: PageContext | None = None  # the page the shopper is on
    page_product: ProductDetail | None = None  # that page's product, loaded from the DB (not trusted from the browser)


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
    results_title: str | None = Field(
        default=None,
        max_length=60,
        description="Short heading for the product cards on the page, e.g. 'Hoodies' or 'Berkeley gear under $60'.",
    )


# ---------- Lookup tool results (Problem 6) ----------
# Every result carries an explicit status so "not found" and "out of stock" are facts from the DB,
# never gaps the model fills in. Values are None whenever the DB has no answer.

LookupStatus = Literal["found", "not_found"]
SizeStatus = Literal["in_stock", "out_of_stock", "size_not_found"]


class DescriptionLookup(BaseModel):
    """Result of get_product_description."""

    status: LookupStatus
    requested: str = Field(description="The product id or name exactly as asked.")
    product_id: str | None = None
    name: str | None = None
    garment_type: str | None = None
    description: str | None = None
    colors: list[str] = Field(default_factory=list)
    message: str = Field(description="One-line plain answer to relay, e.g. 'Not Found'.")


class PriceLookup(BaseModel):
    """Result of get_price. price is the exact catalogue value in USD, or None if not found."""

    status: LookupStatus
    requested: str
    product_id: str | None = None
    name: str | None = None
    price: float | None = None
    currency: Literal["USD"] = "USD"
    message: str


class SizeAvailability(BaseModel):
    """Stock for one size. quantity is None only when the size doesn't exist for this product."""

    size: str
    quantity: int | None
    status: SizeStatus


class StockLookup(BaseModel):
    """Result of check_stock: every size, or just the size asked about."""

    status: LookupStatus
    requested: str
    requested_size: str | None = None
    product_id: str | None = None
    name: str | None = None
    sizes: list[SizeAvailability] = Field(default_factory=list)
    total_in_stock: int | None = None
    message: str
