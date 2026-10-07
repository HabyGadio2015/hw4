"""Database access, model setup, and the tools the Campus Customs agent can call.

Every price and stock number the agent sees comes from data/campus_customs.db through these
functions, opened read-only. The agent's tools never touch the users or chat tables.
"""

from __future__ import annotations

import json
import os
import re
import sqlite3
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")  # keep server logs clean

from openai import AsyncOpenAI
from pydantic_ai import RunContext
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

from models import (
    DescriptionLookup,
    PriceLookup,
    ProductCard,
    ProductDetail,
    ProductMatch,
    ProductSummary,
    ShopDeps,
    SizeAvailability,
    SizeStock,
    StockLookup,
)

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent  # HW 4
WORKSPACE_DIR = PROJECT_DIR.parent  # AI Foundations (root .env lives here)
DATA_DIR = PROJECT_DIR / "data"
DB_PATH = DATA_DIR / "campus_customs.db"
PRODUCTS_DIR = DATA_DIR / "products"

MODEL_NAME = "gpt-5.6-luna"  # AGENTS.md default; PORTKEY_MODEL in .env overrides it
DEFAULT_BASE_URL = "https://api.portkey.ai/v1"
REQUEST_TIMEOUT_SECONDS = 60

SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]
MAX_SEARCH_RESULTS = 8

# Shopper words → words used in the catalogue.
SYNONYMS = {
    "hoodie": ["hoodie", "hooded", "hood"],
    "hoodies": ["hoodie", "hooded", "hood"],
    "sweatshirt": ["sweatshirt", "crewneck", "hoodie", "hooded"],
    "tee": ["t-shirt", "tee"],
    "tees": ["t-shirt", "tee"],
    "tshirt": ["t-shirt"],
    "shirt": ["shirt", "t-shirt"],
    "crew": ["crewneck"],
    "quarter": ["quarter-zip", "1-4-zip", "1/4"],
    "zip": ["zip"],
    "jacket": ["jacket", "fleece", "bomber"],
    "grey": ["gray"],
}
STOPWORDS = {"a", "an", "the", "and", "or", "for", "with", "in", "of", "do", "you", "have", "any", "some", "me", "show", "i", "want", "looking", "is", "are", "my"}


# ---------- Environment & model ----------


def load_env() -> None:
    """Load PORTKEY_API_KEY etc. from HW 4/.env, else the workspace-root .env. Never copies the key into source."""
    for env_file in (PROJECT_DIR / ".env", WORKSPACE_DIR / ".env"):
        if not env_file.exists():
            continue
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if line and not line.startswith("#") and "=" in line:
                name, value = line.split("=", 1)
                os.environ.setdefault(name.strip(), value.strip().strip("'\""))
        return


def make_model() -> OpenAIResponsesModel:
    """gpt-5.6-luna (or PORTKEY_MODEL) through Portkey's OpenAI-compatible API, using PORTKEY_API_KEY."""
    load_env()
    api_key = os.getenv("PORTKEY_API_KEY") or os.getenv("portkey_api_key")
    if not api_key:
        raise RuntimeError("Set PORTKEY_API_KEY in the workspace-root .env file.")
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=os.getenv("PORTKEY_BASE_URL") or DEFAULT_BASE_URL,
        default_headers={"x-portkey-api-key": api_key},
        timeout=REQUEST_TIMEOUT_SECONDS,  # don't let a stalled call hang the chat
        max_retries=1,
    )
    return OpenAIResponsesModel(os.getenv("PORTKEY_MODEL") or MODEL_NAME, provider=OpenAIProvider(openai_client=client))


# ---------- Database helpers (shared by the API routes and the agent tools) ----------


def connect() -> sqlite3.Connection:
    # Read-only: nothing here can change catalogue or stock.
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def image_url(image_file_path: str) -> str:
    # DB stores "products/<file>.jpg"; served at /media/products/<file>.jpg
    return f"/media/{image_file_path}"


def _size_key(size: str) -> int:
    return SIZE_ORDER.index(size) if size in SIZE_ORDER else len(SIZE_ORDER)


def _stock_by_product(conn: sqlite3.Connection, product_ids: list[str]) -> dict[str, list[SizeStock]]:
    if not product_ids:
        return {}
    marks = ",".join("?" * len(product_ids))
    stock: dict[str, list[SizeStock]] = {pid: [] for pid in product_ids}
    for r in conn.execute(f"SELECT product_id, size, quantity FROM inventory WHERE product_id IN ({marks})", product_ids):
        stock[r["product_id"]].append(SizeStock(size=r["size"], quantity=r["quantity"]))
    for sizes in stock.values():
        sizes.sort(key=lambda s: _size_key(s.size))
    return stock


def list_product_summaries() -> list[ProductSummary]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT c.product_id, c.name, c.garment_type, c.description, c.price, c.image_file_path,
                   COALESCE(SUM(i.quantity), 0) AS total_qty
            FROM catalogue c
            LEFT JOIN inventory i ON i.product_id = c.product_id
            GROUP BY c.product_id
            ORDER BY c.name
            """
        ).fetchall()
    return [
        ProductSummary(
            product_id=r["product_id"],
            name=r["name"],
            garment_type=r["garment_type"],
            description=r["description"],
            price=r["price"],
            image_url=image_url(r["image_file_path"]),
            in_stock=r["total_qty"] > 0,
        )
        for r in rows
    ]


def fetch_product_detail(product_id: str) -> ProductDetail | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM catalogue WHERE product_id = ?", (product_id,)).fetchone()
        if row is None:
            return None
        inventory = _stock_by_product(conn, [product_id])[product_id]
    return ProductDetail(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        price=row["price"],
        image_url=image_url(row["image_file_path"]),
        in_stock=any(s.quantity > 0 for s in inventory),
        colors=json.loads(row["colors"]),
        search_tags=json.loads(row["search_tags"]),
        inventory=inventory,
    )


def product_cards(product_ids: list[str]) -> list[ProductCard]:
    """Turn the agent's product_ids into cards using DB values only; unknown ids are dropped."""
    ids = list(dict.fromkeys(product_ids))  # de-duplicate, keep order
    if not ids:
        return []
    marks = ",".join("?" * len(ids))
    with connect() as conn:
        rows = {r["product_id"]: r for r in conn.execute(f"SELECT * FROM catalogue WHERE product_id IN ({marks})", ids)}
        stock = _stock_by_product(conn, list(rows))
    cards = []
    for pid in ids:
        if pid not in rows:
            continue
        sizes_in_stock = [s.size for s in stock[pid] if s.quantity > 0]
        cards.append(
            ProductCard(
                product_id=pid,
                name=rows[pid]["name"],
                price=rows[pid]["price"],
                image_url=image_url(rows[pid]["image_file_path"]),
                in_stock=bool(sizes_in_stock),
                sizes_in_stock=sizes_in_stock,
            )
        )
    return cards


def _expand_terms(query: str) -> list[list[str]]:
    """Each query word becomes a group of alternatives (synonyms); a product scores per group matched."""
    words = [w for w in re.findall(r"[a-z0-9/'-]+", query.lower()) if w not in STOPWORDS]
    return [SYNONYMS.get(w, [w.rstrip("s") if len(w) > 3 and w.endswith("s") else w]) for w in words]


def search_catalogue(
    query: str, color: str | None = None, max_price: float | None = None, in_stock_only: bool = False
) -> list[ProductMatch]:
    groups = _expand_terms(query)
    with connect() as conn:
        rows = conn.execute("SELECT * FROM catalogue").fetchall()
        stock = _stock_by_product(conn, [r["product_id"] for r in rows])

    scored: list[tuple[int, ProductMatch]] = []
    for r in rows:
        colors = json.loads(r["colors"])
        if color and not any(color.lower() in c.lower() for c in colors):
            continue
        if max_price is not None and r["price"] > max_price:
            continue
        sizes = stock[r["product_id"]]
        total = sum(s.quantity for s in sizes)
        if in_stock_only and total == 0:
            continue
        name_text = f"{r['name']} {r['garment_type']}".lower()
        full_text = f"{name_text} {r['description']} {' '.join(colors)} {r['search_tags']} {r['product_id']}".lower()
        # Name/type matches count double; every query word group must match somewhere unless the query is empty.
        score = 0
        for alternatives in groups:
            if any(a in name_text for a in alternatives):
                score += 2
            elif any(a in full_text for a in alternatives):
                score += 1
        if groups and score == 0:
            continue
        scored.append(
            (
                score,
                ProductMatch(
                    product_id=r["product_id"],
                    name=r["name"],
                    garment_type=r["garment_type"],
                    colors=colors,
                    price=r["price"],
                    total_in_stock=total,
                    sizes_in_stock=[s.size for s in sizes if s.quantity > 0],
                ),
            )
        )
    scored.sort(key=lambda t: (-t[0], t[1].name))
    return [m for _, m in scored[:MAX_SEARCH_RESULTS]]


# ---------- Agent tools ----------


def search_products(
    ctx: RunContext[ShopDeps],
    query: str,
    color: str | None = None,
    max_price: float | None = None,
    in_stock_only: bool = False,
) -> list[ProductMatch]:
    """Search the Campus Customs catalogue. Returns up to 8 matches with exact price and the sizes in stock.

    Args:
        query: Keywords from the shopper, e.g. "navy hoodie", "Berkeley quarter zip", "baseball tee".
        color: Optional color filter, e.g. "navy", "gray", "white".
        max_price: Optional maximum price in US dollars.
        in_stock_only: True to hide items that are sold out in every size.
    """
    return search_catalogue(query, color=color, max_price=max_price, in_stock_only=in_stock_only)


SIZE_ALIASES = {
    "xs": "XS", "x-small": "XS", "extra small": "XS", "xsmall": "XS",
    "s": "S", "small": "S",
    "m": "M", "medium": "M", "med": "M",
    "l": "L", "large": "L",
    "xl": "XL", "x-large": "XL", "extra large": "XL", "xlarge": "XL",
    "xxl": "XXL", "2xl": "XXL", "xx-large": "XXL", "2x": "XXL", "xxlarge": "XXL",
}
NOT_FOUND = "Not Found"


def normalize_size(size: str) -> str:
    """'medium' → 'M', '2XL' → 'XXL'. Unknown sizes are returned upper-cased so they report as not found."""
    key = size.strip().lower()
    return SIZE_ALIASES.get(key, size.strip().upper())


def find_product_row(conn: sqlite3.Connection, product: str) -> sqlite3.Row | None:
    """Exact product_id first, then exact name (case-insensitive). No fuzzy guessing."""
    key = product.strip()
    row = conn.execute("SELECT * FROM catalogue WHERE product_id = ?", (key,)).fetchone()
    if row is None:
        row = conn.execute("SELECT * FROM catalogue WHERE lower(name) = lower(?)", (key,)).fetchone()
    return row


def lookup_description(product: str) -> DescriptionLookup:
    with connect() as conn:
        row = find_product_row(conn, product)
    if row is None:
        return DescriptionLookup(status="not_found", requested=product, message=f"{NOT_FOUND}: no product '{product}'.")
    return DescriptionLookup(
        status="found",
        requested=product,
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        colors=json.loads(row["colors"]),
        message=row["description"],
    )


def lookup_price(product: str) -> PriceLookup:
    with connect() as conn:
        row = find_product_row(conn, product)
    if row is None:
        return PriceLookup(status="not_found", requested=product, message=f"{NOT_FOUND}: no product '{product}', so no price.")
    return PriceLookup(
        status="found",
        requested=product,
        product_id=row["product_id"],
        name=row["name"],
        price=row["price"],
        message=f"{row['name']} costs ${row['price']:.2f}.",
    )


def lookup_stock(product: str, size: str | None = None) -> StockLookup:
    with connect() as conn:
        row = find_product_row(conn, product)
        if row is None:
            return StockLookup(
                status="not_found", requested=product, requested_size=size,
                message=f"{NOT_FOUND}: no product '{product}', so no stock information.",
            )
        stock = _stock_by_product(conn, [row["product_id"]])[row["product_id"]]

    def availability(s: SizeStock) -> SizeAvailability:
        return SizeAvailability(size=s.size, quantity=s.quantity, status="in_stock" if s.quantity > 0 else "out_of_stock")

    total = sum(s.quantity for s in stock)
    base = dict(status="found", requested=product, product_id=row["product_id"], name=row["name"], total_in_stock=total)
    if size is None:
        sizes = [availability(s) for s in stock]
        in_stock = [f"{a.size} ({a.quantity})" for a in sizes if a.status == "in_stock"]
        out = [a.size for a in sizes if a.status == "out_of_stock"]
        message = f"{row['name']}: in stock {', '.join(in_stock) or 'none'}; out of stock {', '.join(out) or 'none'}."
        return StockLookup(**base, sizes=sizes, message=message)

    wanted = normalize_size(size)
    match = next((s for s in stock if s.size == wanted), None)
    if match is None:
        sizes = [SizeAvailability(size=wanted, quantity=None, status="size_not_found")]
        offered = ", ".join(s.size for s in stock)
        return StockLookup(**base, requested_size=size, sizes=sizes,
                           message=f"Size {wanted} {NOT_FOUND} for {row['name']}. Sizes offered: {offered}.")
    a = availability(match)
    message = (f"{row['name']} size {a.size}: {a.quantity} in stock." if a.status == "in_stock"
               else f"{row['name']} size {a.size}: Out of Stock.")
    return StockLookup(**base, requested_size=size, sizes=[a], message=message)


def get_product_description(ctx: RunContext[ShopDeps], product: str) -> DescriptionLookup:
    """Look up a product's real description, garment type, and colors in the database.

    Args:
        product: The exact product_id from search_products (or the product's exact name).
    """
    return lookup_description(product)


def get_price(ctx: RunContext[ShopDeps], product: str) -> PriceLookup:
    """Look up a product's exact price (USD) in the database. Returns status 'not_found' if it doesn't exist.

    Args:
        product: The exact product_id from search_products (or the product's exact name).
    """
    return lookup_price(product)


def check_stock(ctx: RunContext[ShopDeps], product: str, size: str | None = None) -> StockLookup:
    """Look up how many are in stock by size in the database.

    Each size comes back as in_stock (with quantity), out_of_stock (quantity 0), or size_not_found.

    Args:
        product: The exact product_id from search_products (or the product's exact name).
        size: Optional single size to check, e.g. "M", "medium", "XL", "2XL". Omit to get every size.
    """
    return lookup_stock(product, size)


AGENT_TOOLS = [search_products, get_product_description, get_price, check_stock]
