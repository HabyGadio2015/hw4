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

## 3. Accounts & Auth (Problem 4)

Code: `backend/auth.py` (router mounted in `main.py`), `frontend/src/auth.tsx` (AuthProvider/useAuth), `pages/Login.tsx`, `pages/CreateAccount.tsx`.

| Endpoint | Body | Result |
|---|---|---|
| `POST /api/auth/signup` | first_name, last_name, email, password, confirm_password | 201 + `UserPublic`, logs the user in |
| `POST /api/auth/login` | email, password | 200 + `UserPublic`, or 401 "Incorrect email or password." |
| `POST /api/auth/logout` | none | 204, clears the session cookie |
| `GET /api/auth/me` | none | the current `UserPublic`, or 401 |

### What we store for a user (`users` row)
- `first_name`, `last_name`, `name` ("First Last", since the column is NOT NULL), `email` (trimmed and lowercased, unique), `created_at` (set by the DB).
- `password_hash`: **never the password itself.** For new accounts the format is `pbkdf2_sha256$600000$<32-hex random salt>$<64-hex digest>`.
- The API only ever returns `UserPublic` (id, first_name, last_name, name, email). The hash never leaves the backend and will never be given to the agent.

### How passwords are protected
- **Slow, salted hashing:** PBKDF2-HMAC-SHA256 with 600,000 iterations (OWASP 2023), from Python's standard library. Every user gets a unique random salt, so identical passwords produce different hashes and precomputed rainbow tables don't work. If the DB leaked, each guess would cost 600k hash rounds per user.
- **Seed users still work:** the 3 seed hashes use a legacy format, `pbkdf2_sha256$<salt>$<digest>`, with 120,000 iterations (verified against the test user). `verify_password` handles both formats.
- **Constant-time compare** (`hmac.compare_digest`), plus a dummy hash check when the email is unknown, so response timing doesn't reveal which emails exist.
- **Same error message** for a wrong email and a wrong password.
- **Brute-force limit:** 5 failed logins per email or 20 per IP within 15 minutes → 429 for 15 minutes (in memory).
- **Signup checks** on both front end and backend: all fields required, valid email, password ≥ 8 characters, password = confirm password, no duplicate email (case-insensitive) → 409.
- **Sessions:** an HMAC-SHA256-signed token `{uid, exp}` in an `HttpOnly`, `SameSite=Lax` cookie that lasts 7 days. Page JavaScript (or an injected script) can't read it, and a tampered token is rejected. The secret comes from `SESSION_SECRET` (env) or a random value per run. Set `secure=True` when served over HTTPS.
- **Never logged or committed:** plaintext passwords are not logged or sent to any model. The DB is git-ignored.

### Verified (2026-10-05)
- Seed test user `test@campuscustoms.yale.edu` / `password` → logs in, the nav shows "Hi, Test", the session survives a reload, and logout works.
- A brand-new account created through the form → stored as user id 4 with a 600k-iteration hash, logs in, logs out, and logs back in (email is case-insensitive). The plaintext password is not anywhere in the DB file. Test credentials are in `backend/TEST_ACCOUNTS.md`.
- Wrong password, unknown email, mismatched confirm, short password, bad email, duplicate email, tampered cookie, and the 6th rapid failed login (429) are all rejected.

## 4. Agent Backend (Problem 5)

Same layout as HW 3: one API app plus four agent files in `backend/`.

| File | Role |
|---|---|
| `main.py` | The FastAPI app that Uvicorn runs. Product, image, auth, and **chat** routes. |
| `prompts/prompt.md` | The one system prompt: voice, honesty rules, safety basics. Grow this same file later. |
| `agent.py` | Agent entry and wiring: builds the PydanticAI `Agent` and exposes `chat()`. |
| `tools.py` | Model setup (`make_model`), read-only DB helpers, and the agent tools. |
| `models.py` | **All** Pydantic types: catalogue, auth, chat API, agent output. |

**Run** from `backend/`: `source .venv/bin/activate` then `uvicorn main:app --reload --port 8000` (verified 2026-10-07). Front end: `npm run dev -- --port 5174` in `frontend/`.

### How the front end talks to FastAPI
1. The browser only talks to Vite (`localhost:5174`). `vite.config.ts` proxies `/api/*` and `/media/*` to FastAPI on `127.0.0.1:8000`, so it's the same origin: no CORS problems, and the HttpOnly session cookie is sent automatically.
2. `frontend/src/api.ts` is the only place that calls the backend:
   - `GET /api/products`, `GET /api/products/{id}` → Products grid and single-item page
   - `POST /api/auth/signup|login|logout`, `GET /api/auth/me` → `auth.tsx` (AuthProvider)
   - `POST /api/chat` → `ChatWidget.tsx`
3. **Chat round trip:** the widget sends `ChatRequest {message, history}` (text-only history, at most 20 turns, message ≤ 1000 characters). `main.py` reads the optional logged-in user from the cookie and calls `agent.chat()`, which runs the agent, then returns `ChatResponse {reply, products: ProductCard[]}`. The widget shows the reply plus clickable product cards that link to `/products/{id}`.
4. Errors: if the agent fails, the route logs the details on the server and returns a friendly 502 message. Stack traces and keys never reach the browser.

### How the agent is loaded
- **Built once, lazily** (`build_agent()` with `lru_cache`) on the first chat, so the site and product pages still work if the model is down or the key is missing.
- **Prompt file:** `load_system_prompt()` reads `backend/prompts/prompt.md` and **refuses to start if the `## Safety rules` section is missing** (same guard as HW 3). A dynamic `@agent.instructions` line adds only the shopper's first name, or "not logged in". No email, no id, no hash.
- **Model:** `make_model()` in `tools.py` loads `PORTKEY_API_KEY` from `HW 4/.env`, falling back to the workspace-root `.env` (the key is never in source). It builds an `AsyncOpenAI` client pointed at Portkey (`https://api.portkey.ai/v1`, `x-portkey-api-key` header, 60 s timeout, 1 retry) and wraps it in PydanticAI's `OpenAIResponsesModel("gpt-5.6-luna")`. `PORTKEY_MODEL` / `PORTKEY_BASE_URL` can override these. No `temperature` is passed (GPT-5 family).
- **Tools** (`AGENT_TOOLS`): `search_products(query, color?, max_price?, in_stock_only?)` → up to 8 `ProductMatch`; `get_product_details(product_id)` → `ProductDetail` with per-size quantities. Both are read-only, and neither can reach the users or chat tables.
- **Output:** `AgentReply {reply, product_ids}`. `product_cards()` rebuilds each card from the DB and **drops unknown ids**, so a card's price or stock can never be made up by the model.
- **Limits:** at most 6 model requests and 8 tool calls per chat turn (`UsageLimits`).

### New types (`models.py`)
`ChatTurn`, `ChatRequest`, `ProductCard`, `ChatResponse`, `ShopDeps` (agent deps: shopper_first_name), `ProductMatch`, `AgentReply`. The Problem 3 and 4 types (`ProductSummary`, `ProductDetail`, `SizeStock`, `SignupRequest`, `LoginRequest`, `UserPublic`) moved here, so all types live in one file.

### Verified (2026-10-07)
- Offline first (no paid calls): compile, search quality, cards dropping fake ids, and full agent wiring with PydanticAI's `TestModel`.
- Live: "navy hoodie in medium?" took 6.9 s and returned 4 cards. All prices and M stock match the DB.
- Logged in as Test User in the browser: "pink hoodies?" → honestly says none (0 pink items in the DB). "Gray tee under $35, XL?" → 6 cards at $32.00, XL in stock on each, all matching the DB.
