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
- **Tools** (`AGENT_TOOLS`): `search_products(query, color?, max_price?, in_stock_only?)` → up to 8 `ProductMatch`; `get_product_details(product_id)` → `ProductDetail` with per-size quantities. Both are read-only, and neither can reach the users or chat tables. *(Problem 6: `get_product_details` was replaced by `get_product_description`, `get_price`, `check_stock`. See section 5.)*
- **Output:** `AgentReply {reply, product_ids}`. `product_cards()` rebuilds each card from the DB and **drops unknown ids**, so a card's price or stock can never be made up by the model.
- **Limits:** at most 6 model requests and 8 tool calls per chat turn (`UsageLimits`).

### New types (`models.py`)
`ChatTurn`, `ChatRequest`, `ProductCard`, `ChatResponse`, `ShopDeps` (agent deps: shopper_first_name), `ProductMatch`, `AgentReply`. The Problem 3 and 4 types (`ProductSummary`, `ProductDetail`, `SizeStock`, `SignupRequest`, `LoginRequest`, `UserPublic`) moved here, so all types live in one file.

### Verified (2026-10-07)
- Offline first (no paid calls): compile, search quality, cards dropping fake ids, and full agent wiring with PydanticAI's `TestModel`.
- Live: "navy hoodie in medium?" took 6.9 s and returned 4 cards. All prices and M stock match the DB.
- Logged in as Test User in the browser: "pink hoodies?" → honestly says none (0 pink items in the DB). "Gray tee under $35, XL?" → 6 cards at $32.00, XL in stock on each, all matching the DB.

## 5. Tools: Product Info and Stock (Problem 6)

All tools are in `backend/tools.py`, and every one reads `campus_customs.db` through a **read-only** connection. Rule: **never invent a price or quantity.** If the DB has no answer, the tool says "Not Found" or "Out of Stock" and the agent repeats that.

| Tool | Answers | Returns (`models.py`) |
|---|---|---|
| `search_products(query, color?, max_price?, in_stock_only?)` | "What do you have…?" Finds product_ids. | `list[ProductMatch]` |
| `get_product_description(product)` | (1) Product description | `DescriptionLookup` |
| `get_price(product)` | (2) Price | `PriceLookup` |
| `check_stock(product, size?)` | (3) How many are in stock by size | `StockLookup` (list of `SizeAvailability`) |

`product` = the exact `product_id`, or else an exact case-insensitive name match. There's **no fuzzy matching**, so the tool can't quietly answer about a different item. Sizes are normalized ("medium" → M, "2XL" → XXL). Unknown sizes stay as given and are reported as not found. (The Problem 5 `get_product_details` tool was replaced by these three focused lookups. `fetch_product_detail` still powers the product page API.)

### Why these fields
- **`status`** (`"found"` / `"not_found"`): an explicit, typed answer for a missing product, so a miss is a fact from the DB, not an empty result the model might fill in. It's a `Literal`, so it can't drift into other wording.
- **`requested`** (and `requested_size`): echoes exactly what the agent asked for, so a "Not Found" answer can name what wasn't found. It's also useful for auditing a wrong lookup.
- **`product_id` + `name`**: the id links the result to product cards. The name is what the shopper hears. Both are `None` when not found.
- **`price: float | None` + `currency: "USD"`**: the exact `catalogue.price`. `None`, never 0, when not found, because $0.00 would look like a real (free) price.
- **`SizeAvailability.status`** (`in_stock` / `out_of_stock` / `size_not_found`): the three cases you asked the agent to tell apart. Out of Stock (the size exists, quantity 0) is not the same as Not Found (we don't make that size).
- **`SizeAvailability.quantity: int | None`**: the exact `inventory.quantity`. `0` means out of stock. `None` means the size doesn't exist, so neither case can be mistaken for the other.
- **`total_in_stock`**: answers "is it available at all?" without the model having to add numbers up (and risk getting the sum wrong).
- **`message`**: a ready-made plain sentence from the DB values (e.g. "size XS: Out of Stock."), so the simplest correct reply is to repeat it, which leaves less room to paraphrase into an error.
- **`description`, `garment_type`, `colors`** (`DescriptionLookup`): the catalogue text and the parsed JSON color list, so "do you have it in pink?" is answered from real colors.
- Lists default to empty and values default to `None`, never made-up placeholder values.

### Prompt changes (`prompts/prompt.md`)
New "Tools: product info and stock" section: a table matching each kind of question to a tool, a multi-step example, and how to word each status ("Not Found", "Out of Stock", the sizes offered). "Honesty first" now says: **NEVER invent a price or a quantity.** Every number must come from a tool result in this conversation.

### Verified (2026-10-07)
- Offline: in stock (M: 5), out of stock (XS: 0), size not found (XXXL), size aliases ("medium", "2xl"), product not found, and lookup by name. All match the DB.
- Live: "Baseball Left Chest Crewneck price, XS / medium / XXXL, how many M?" → "$58.00. XS is Out of Stock, medium is in stock with 5 available, XXXL is Not Found… Sizes offered: XS–XXL" (8.6 s). "Yale Pink Unicorn Hoodie price, L?" → "Not Found in our catalogue, so I can't confirm a price or Large availability" plus a real alternative (5.4 s).

## 6. Chat Search That Updates The Page (Problem 7)

**The API contract:** the agent doesn't write the cards; it returns structured matches, and the front end renders them.

`POST /api/chat` → `ChatResponse`:
- `reply`: a short message for the chat bubble.
- `results_title`: a short heading for the page (e.g. "Yale Hoodies"), or `null`.
- `products: ProductCard[]`: up to 12 matches. Each card has `product_id`, `name`, `garment_type`, `short_info`, `colors`, `price`, `image_url`, `in_stock`, `sizes_in_stock`.

**How a question becomes cards**
1. The shopper asks "what hoodies do you have?". The agent calls `search_products` (now up to 12 results) and returns `AgentReply {reply, product_ids, results_title}`.
2. `agent.chat()` runs `product_cards()`: every card is rebuilt from the database, so names, prices, sizes, and images are real. Unknown ids are dropped. `short_info` is the first sentence of the catalogue description.
3. `ChatWidget` receives the response, calls `show(title, products)` on the shared `ResultsProvider` (`frontend/src/results.tsx`), and scrolls to the top. `ResultsPanel` (under the nav, on every page) draws the cards. The chat bubble only says "↑ Showing N items on the page".
4. Each card links to its product page. "Clear results ×" hides the panel. Follow-up messages with no products leave the current cards in place.

**Look:** a soft Yale-blue gradient panel, a serif title, and a responsive grid. Cards have a garment-type chip, a "Sold out" chip when applicable, a large photo that zooms on hover, a 2-line description, size chips, and a big serif price. They fade up one after another, and the animation is off for visitors who prefer reduced motion.

**Prompt:** a new "Showing items on the page" section in `prompts/prompt.md`: search, then return the matching ids (best first, at most 12) with a short title; keep the text short because the cards carry the details; return only real matches; no matches means an empty list and an honest answer.

**Code changes:** `models.py` (`ProductCard` fields, `ChatResponse.results_title`, `AgentReply.results_title`, `MAX_PRODUCT_CARDS` 6 → 12), `tools.py` (`short_info`, richer `product_cards`, search limit 12), `agent.py`, `ResultsPanel.tsx`, `results.tsx`, `ChatWidget.tsx`, `App.css`.

**Verified (2026-10-07):** offline compile, pyflakes, tsc, and lint all pass. Live: "what hoodies do you have?" → the title "Yale Hoodies" and 12 cards (e.g. Basic Hoodie Big Yale $68.00 with sizes XS–XXL, Brooks Brothers Full Zip $88.00) rendered on the page, with a short chat reply. Checked on screen.

### Update (Problem 7 follow-up): how search results reach the page, and how a card opens the detail view
*(Added after section 6. Nothing above was changed.)*

**Path from question to detail page**
1. **Question → search:** the shopper asks the chat about a type of item. The agent calls `search_products`, which reads the catalogue (up to 12 matches).
2. **Search → structured matches:** the agent returns `product_ids` plus a `results_title`. The backend rebuilds each match as a `ProductCard` from the database (`product_cards()`), and `POST /api/chat` returns `{reply, results_title, products}`.
3. **Matches → page:** `ChatWidget` hands the cards to the shared `ResultsProvider`, and `ResultsPanel` draws them under the menu bar.
4. **Card → detail view:** every card is a router link to `/products/{product_id}`, the same route the Products grid uses. `ProductDetail` loads `GET /api/products/{id}` and shows the large image beside the full description, price, colors, and stock for every size. Because the card and the detail page share the same `product_id`, a card can only open the product it shows.

**Behavior added**
- On a detail page the results panel is hidden, so the product fills the screen. The results stay saved in memory.
- The detail page shows "← Back to chat results: {title}" next to "← Back to Products". It returns to the page with all the cards restored.
- Every page change scrolls to the top, so a clicked card always opens at the top of the detail page.

**Prompt:** `prompts/prompt.md` now says that `product_ids` become cards in the results panel, that each card opens its own product page by its exact `product_id`, and that invented ids would make dead cards, so ids must be copied from tool results.

**Bug found and fixed while testing:** my new scroll-to-top effect in `App.tsx` returned a value, which blanked the whole page. It now returns nothing. tsc and lint did not catch it; only running it in the browser did.

**Verified (2026-10-07), live:** asked "show me your t-shirts" → "Yale T-shirts", 12 cards. Clicked card 2 (Benjamin Franklin T Shirt) and card 12 (School Of Nursing Crest T Shirt). Each opened `/products/{id}` with the same name, a $32.00 price matching the card, a loaded large image, a description, and 6 size cells. The panel was hidden on the detail page, and "Back to chat results" brought back all 12 cards.

## 7. Customer Memory (Problem 8)

**Note on section 4:** that section says the agent sees only a first name, with no email or id. *(Problem 8: this changed on purpose. The agent now also sees the shopper's full name and email, and nothing else. See "What the agent sees" below. The password hash is still never included.)*

### How user chat history is stored
- **Table:** the existing `chat_messages` table, with one row per message: `id`, `user_id` (→ `users.id`), `role` (`user` / `assistant`), `content`, `products_json`, `created_at`. No schema change.
- **Who is saved:** **logged-in shoppers only.** In `POST /api/chat`, after the agent answers successfully, `memory.save_exchange()` writes two rows (the shopper's message, then the assistant's reply with its product cards in `products_json`). Failed chats save nothing. Guests are never written to the database.
- **Reload:** `GET /api/chat/history` (requires login, 401 for guests) returns the last 50 messages. `products_json` is used only for its `product_id`s. The cards are rebuilt from the catalogue, so a returning shopper sees current prices and stock, and sold-out or removed items are handled. (The older seed rows in a different format load fine for the same reason.)
- **The agent's memory comes from the database, not the browser.** For a logged-in shopper the backend loads the last 20 saved messages itself and ignores any history the browser sends. Nobody can forge a shopper's past, and the conversation continues across visits.
- **Scoped per user:** every query filters on `user_id` from the signed session cookie, so one shopper can never read another's chat.
- **Guests:** they can chat as before. Their history exists only in the open browser tab (the widget sends up to the last 20 turns with each message) and disappears on reload.
- **No leaking between accounts:** `App.tsx` re-creates the chat widget with `key = user id`. Logging out or switching accounts clears the chat and the results panel, and logging in loads that shopper's saved chat. Saved messages with product cards show a "↑ Show these N items on the page" button that puts those cards back on the page.

### What the agent sees (customer fields)
`ShopDeps` (the agent's per-request deps, in `models.py`) holds three things:
- `user: UserPublic | None`, the logged-in shopper: `id`, `first_name`, `last_name`, `name`, `email`. **Never** the password hash or any other `users` column. `None` for guests.
- `page: PageContext | None`, where the shopper is (below).
- `page_product: ProductDetail | None`, that page's product, loaded from the database.

`describe_context()` in `agent.py` turns `ShopDeps` into plain sentences, added to the system prompt on every turn through `@agent.instructions`. A logged-in shopper's instructions read: "Name: Test User. First name: Test. Email: …. Their chats are saved for them." A guest's read: "not logged in, so you don't know who they are, and their chat is not saved." `prompts/prompt.md` has a new section "Who you're talking to, and what they're looking at": greet by first name once, give the email only if the shopper asks what's on their account, never reveal anything about other shoppers, and never claim to remember what isn't in the conversation. No new tool was needed. The context in deps covers it.

### How page context is passed
1. **Browser:** `ChatWidget` reads the route. On `/products/{id}` it sends `page: {path, product_id}` with every message (`POST /api/chat` → `ChatRequest.page: PageContext`). On other pages it sends just the path. The input placeholder changes to "Ask about this item…" on a product page.
2. **Backend:** `agent.make_deps()` ignores any product text from the browser and looks up `page.product_id` in the catalogue (`fetch_product_detail`). An unknown id is treated as "no product".
3. **Agent:** `describe_context()` states the product name, `product_id`, garment type and colors, plus: "If they say this / it / this one / this item, they mean this product; use this product_id with your tools." So "do you have this in blue?" refers to the page's item. The agent still gets prices and stock from the tools, never from page context.

### Verified (2026-10-07)
- **Injected context, offline:** logged-in + product page, guest + home, and unknown product id each produced the right instructions.
- **Live, as Test User on the Basic Hoodie page:** "do you have this in blue?" → "…comes in navy blue and white… not a lighter or royal blue" (matches its colors in the DB). "What name and email do you have for me?" → "Test User" and "test@campuscustoms.yale.edu".
- **Storage:** history before 6 messages, after 10 (+4 rows). A guest asking the same question on that page got a correct answer and added 0 rows. `GET /api/chat/history` returned 401 for the guest.
- **Browser:** a logged-in shopper's widget showed "Chatting as Test" with 11 messages reloaded (greeting + 10 saved) and "Show these N items" buttons. The request carried `page = {path: /products/basic-hoodie-big-yale, product_id: basic-hoodie-big-yale}`. After logging out the widget had only the greeting, the header was back to "Merch assistant", and the results panel was gone. No console errors.
- **Test data:** the Test User account (in the git-ignored DB) now has 4 more saved messages from these tests.

### Update (Problem 8 double-check)
*(Added after section 7. Nothing above was changed.)*
- **Prompt-injection hardening:** the page path comes from the browser, and it was being copied into the agent's instructions. `describe_context()` now includes a path only if it is a plain site path (`/` followed by letters, digits, `/`, `_`, `-`, at most 100 characters). A hostile or overlong path is dropped. Product details still come from the database, never from the browser.
- **Button fix:** on a single-item page the results panel is hidden by design, so the saved-chat button "↑ Show these N items on the page" did nothing visible. It now takes the shopper to `/products`, where the panel shows. Tested with a logged-in shopper: the button went to `/products`, showed the 8 saved cards (title "Earlier results"), and a card still opened its detail page. No console errors.
- **Re-checked and fine:** compile, pyflakes, tsc, and lint are clean. No stale `shopper_first_name` references remain. The database, images, `.env`, and `.venv` are not tracked.

## 8. Usability Improvements (Problem 9)

Full write-up with evidence: [usability.md](usability.md).

- **Tools (section 5, extended):** new `get_product_snapshot(product)` returns `ProductSnapshot` (status, name, garment type, description, colors, exact price, every size's availability, total in stock, message) from one database read. It uses the same statuses as the other lookups (`not_found`, `out_of_stock`, `size_not_found`). The prompt table and a "Faster" bullet tell the agent to prefer it when a question needs more than one fact.
- **Safety (section 4, extended):** `backend/guard.py` runs before the model, in `POST /api/chat`. A valid card number (Luhn check), an SSN, or "password / PIN / CVV is ..." gets a fixed safety reply. The message is **not** sent to the model and **not** saved to `chat_messages`.
- **API contract:** `ChatResponse.tools_used` lists the catalogue tools the agent called that turn. Every chat also logs one server line (`chat user=… tools=… requests=… tokens_in=… tokens_out=… ms=…`) and never logs the message text.
- **Shop pages:** a product finder on the Products page and conversation starters in the chat (see usability.md).
