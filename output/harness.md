# Campus Customs — Agent Harness

Living spec for the Campus Customs website + chatbot. Grows each problem (data → models → tools → safety → specs).

## 1. Database (`data/campus_customs.db`)

SQLite, 5 tables. The database and `data/products/` images are git-ignored and never committed.

| Table | Rows | Purpose |
|---|---|---|
| `catalogue` | 102 | One row per product — the source of truth for what we sell and its price |
| `inventory` | 612 | Stock per product per size (102 products × 6 sizes) |
| `users` | 3 | Shopper accounts with hashed passwords |
| `chat_messages` | 22 | Saved chat history per user, including products shown |
| `sqlite_sequence` | 3 | SQLite internal AUTOINCREMENT counters |

### `catalogue`

| Field | Type | Why it matters |
|---|---|---|
| `product_id` | TEXT PK | Stable slug (e.g. `basic-hoodie-big-yale`) that links to inventory and lets the chatbot point the page at exact items. |
| `name` | TEXT | Display name on product cards and what the bot says when recommending an item. |
| `garment_type` | TEXT | Lets shoppers/bot filter by kind (hoodie, crewneck, T-shirt); 22 inconsistent labels (e.g. "t-shirt" vs "short-sleeve T-shirt") need normalizing for reliable filters. |
| `description` | TEXT | Rich visual text the bot uses to match vague requests ("navy with big YALE letters") and to answer honestly about what the item looks like. |
| `colors` | TEXT (JSON list) | Answers "do you have it in pink?" — bot must only claim colors listed here; stored as a JSON string, so parse before use. |
| `search_tags` | TEXT (JSON list) | Keyword hooks (sport, residential college, "The Game") for search and for surfacing matching items on the page. |
| `image_file_path` | TEXT | Relative path (`products/<id>.jpg`) to the product photo; all 102 match a file in `data/products/` and get served to the front end. |
| `price` | REAL | The only valid price ($32–$98); the bot must quote this exactly and never invent discounts. |

### `inventory`

| Field | Type | Why it matters |
|---|---|---|
| `id` | INTEGER PK | Internal row key; not shown to shoppers. |
| `product_id` | TEXT FK → catalogue | Ties stock to a product so the page and bot can show availability per item. |
| `size` | TEXT | One of XS, S, M, L, XL, XXL — lets the bot answer "do you have a medium?" precisely. |
| `quantity` | INTEGER | Units on hand (5,920 total); 145 size rows are 0, so the bot must say "out of stock" honestly instead of guessing. |

`UNIQUE (product_id, size)` guarantees one stock number per size — no conflicting answers.

### `users`

| Field | Type | Why it matters |
|---|---|---|
| `id` | INTEGER PK | Links a shopper to their chat history. |
| `name` | TEXT | Full display name for the account header and personalized greetings. |
| `email` | TEXT UNIQUE | Login identifier; uniqueness blocks duplicate accounts. Never exposed to the chatbot or other users. |
| `password_hash` | TEXT | `pbkdf2_sha256$...` hash — signup/login verify against it; plaintext passwords are never stored, logged, or sent to the model. |
| `created_at` | TEXT | Account creation timestamp for auditing and "member since". |
| `first_name` | TEXT (nullable) | Friendly greeting ("Hi Ada"); added later, so code must handle NULL. |
| `last_name` | TEXT (nullable) | Completes the profile; nullable, same caution as above. |

Existing accounts: Test User (`test@campuscustoms.yale.edu`, the provided test login), Ada Lovelace, Tauhid Zaman.

### `chat_messages`

| Field | Type | Why it matters |
|---|---|---|
| `id` | INTEGER PK | Message order key. |
| `user_id` | INTEGER FK → users | Scopes history to one shopper so no one sees another user's chats. |
| `role` | TEXT | `user` or `assistant` — rebuilds the conversation for the agent's context. |
| `content` | TEXT | The message text (assistant replies use Markdown). |
| `products_json` | TEXT (JSON, nullable) | Snapshot of products the bot showed (incl. `image_url` like `/media/products/...` and per-size inventory) so matching items reappear on the page when history reloads. |
| `created_at` | TEXT | Timestamp for ordering and display. |

### `sqlite_sequence`

| Field | Why it matters |
|---|---|
| `name`, `seq` | SQLite's internal AUTOINCREMENT tracker; we never edit it, but it explains new IDs. |

### Takeaways for the build
- Price and stock answers come **only** from `catalogue.price` and `inventory.quantity` — the honesty requirement.
- `colors` and `search_tags` are JSON strings → parse in the backend.
- `garment_type` needs normalizing for filters.
- Images are served from `data/products/` via the backend (existing history expects `/media/products/<file>`).

## 2. Website & API (Problem 3)

**Front end** (`frontend/`, React + Vite + TypeScript, port 5174): nav bar (Home, Products, About Us, Log in, Create Account), Yale blue theme, Products grid, single-item page at `/products/:productId`, and a floating chat panel in the bottom right. For now the chat is a stub (`sendChat()` in `src/api.ts`). Vite forwards `/api` and `/media` requests to the backend.

**Backend** (`backend/main.py`, FastAPI, port 8000): read-only SQLite connection (`mode=ro`).

| Endpoint | Returns | Why it matters |
|---|---|---|
| `GET /api/health` | `{status}` | Quick check that the backend is running. |
| `GET /api/products` | `list[ProductSummary]` | Feeds the Products grid; `in_stock` drives the "Sold out" badge. |
| `GET /api/products/{id}` | `ProductDetail` or 404 | Feeds the single-item page with exact price and stock per size. |
| `/media/products/<file>` | image | Serves only the images folder, never `data/`, so the DB can't be downloaded. |

**Pydantic models** (backend) mirrored as TypeScript types (`frontend/src/types.ts`):
- `ProductSummary`: product_id, name, garment_type, description, price, image_url, in_stock
- `ProductDetail`: ProductSummary + colors, search_tags (parsed from JSON), inventory
- `SizeStock`: size, quantity (sorted XS→XXL)
- `ChatMessage` (frontend only, for now): role, content
