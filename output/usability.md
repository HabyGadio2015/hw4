# Usability Improvements (Problem 9)

Four improvements: two on the shop pages (front end) and two on the agent / backend.
Each entry says what was added, why it helps a Campus Customs shopper or the business, and where to see it.
**Status: planned.** Each entry gets marked "built and verified" as it is finished.

*Reading of the assignment:* the text describes the second group as things that make the agent "better, more accurate, or safer, new agent tools, faster and cheaper", so the two agent / backend items below are that kind of change, and the two front-end items are changes to the pages shoppers see.

## Summary

| # | Improvement | Where | Where to see it in the running app |
|---|---|---|---|
| 1 | Product finder (search, category, in-stock, sort) | Shop page | Products page, toolbar above the grid |
| 2 | Conversation starters in the chat | Shop page | Chat button, bottom right |
| 3 | Sensitive-data guard | Agent / backend | Paste a card number into the chat |
| 4 | One-call product lookup tool `get_product_snapshot` | Agent / backend | Ask a multi-fact question; see `tools_used` and the server log |

## Shop-page (front-end) improvements

### 1. Product finder on the Products page
- **What I will add:** a toolbar above the grid with a search box, category pills with counts (Hoodies, T-Shirts, Crewnecks & Sweatshirts, Quarter-Zips, Jackets & Fleece, Long-Sleeve Tees), an "In stock only" toggle, a sort menu (A-Z, price low to high, price high to low), a live "Showing X of Y" count, a "Clear filters" button, and an empty state. The catalogue has 22 inconsistent garment-type labels, so they get grouped into these 6 categories.
- **Why it helps:** 102 products in one long grid is hard to browse. Shoppers find "navy hoodie" or "tees under $35" in seconds, skip sold-out items, and sort by budget. Finding the right item faster means more sales.
- **Where to see it:** the Products page.
- **Status:** planned.

### 2. Conversation starters in the chat
- **What I will add:** clickable suggestion chips in the chat widget ("What hoodies do you have?", "What would make a good gift for a parent?"). On a product page they become questions about that item ("What sizes are in stock?", "What colors does it come in?"). They disappear once a conversation exists, including a returning shopper's saved chat.
- **Why it helps:** a blank chat box makes people hesitate. One click starts a useful conversation, shows what the assistant can do, and leads to product cards.
- **Where to see it:** the chat button (bottom right) on any page.
- **Status:** planned.

## Agent / backend improvements

### 3. Sensitive-data guard (safer and cheaper)
- **What I will add:** `backend/guard.py` checks each chat message before it goes anywhere. A valid card number (passes the Luhn check), a Social Security number, or "my password / PIN / CVV is ..." gets an instant friendly warning. That message is **not** sent to the AI model and **not** saved to the database.
- **Why it helps:** shoppers sometimes paste card numbers or passwords into chat. Today the prompt only asks the model to ignore them, but the data still reaches the model provider and the saved history. The guard keeps it on the server and saves a model call.
- **Where to see it:** paste a card number into the chat and the warning appears instantly.
- **Status:** planned.

### 4. One-call product lookup tool, `get_product_snapshot` (faster, cheaper, more accurate)
- **What I will add:** a new agent tool returning a product's description, colors, exact price, and stock for every size in one database read. The prompt tells the agent to prefer it when a question needs more than one fact. The chat response also lists `tools_used`, and each chat writes one server log line with the tools called, model requests, token counts and time (never the message text).
- **Why it helps:** "Do you have the Berkeley quarter zip in medium, and how much?" currently takes a search, a stock check and a price check, each a model round trip that re-reads the conversation. One snapshot means fewer model requests, so answers are faster and cheaper. Price and stock come from the same moment, so they can't disagree. The log lets the shop owner watch costs.
- **Where to see it:** ask a multi-fact question; the API response shows `tools_used` and the server log shows requests and tokens per chat.
- **Status:** planned.
