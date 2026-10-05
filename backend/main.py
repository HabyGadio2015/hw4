"""Campus Customs backend.

Problem 3: a small read-only API that serves the product catalogue, stock by
size, and product images from data/campus_customs.db.
Problem 4: accounts and login (auth.py). Later problems grow this into the
PydanticAI agent backend.

Run from HW 4/backend:
    .venv/bin/uvicorn main:app --reload --port 8000
"""

import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from auth import router as auth_router

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "campus_customs.db"
PRODUCTS_DIR = DATA_DIR / "products"

SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"]

app = FastAPI(title="Campus Customs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# Serve only the product images folder, never the whole data/ folder (the DB lives there).
app.mount("/media/products", StaticFiles(directory=PRODUCTS_DIR), name="product-images")


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


def connect() -> sqlite3.Connection:
    # Read-only connection: this API never changes catalogue or stock.
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def image_url(image_file_path: str) -> str:
    # DB stores "products/<file>.jpg"; served at /media/products/<file>.jpg
    return f"/media/{image_file_path}"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/products", response_model=list[ProductSummary])
def list_products() -> list[ProductSummary]:
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


@app.get("/api/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str) -> ProductDetail:
    with connect() as conn:
        row = conn.execute("SELECT * FROM catalogue WHERE product_id = ?", (product_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        stock = conn.execute(
            "SELECT size, quantity FROM inventory WHERE product_id = ?", (product_id,)
        ).fetchall()

    inventory = sorted(
        (SizeStock(size=s["size"], quantity=s["quantity"]) for s in stock),
        key=lambda s: SIZE_ORDER.index(s.size) if s.size in SIZE_ORDER else len(SIZE_ORDER),
    )
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
