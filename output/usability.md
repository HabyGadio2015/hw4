# Usability Improvements (Problem 9)

Four improvements: two on the shop pages (front end) and two on the agent / backend.
Each entry says what was added, why it helps a Campus Customs shopper or the business, and where to see it.
**Status: all four built, and verified in the running app on 2026-10-07.** Evidence is under each entry.

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
- **What I added:** a toolbar above the grid with a search box, category pills with counts (Hoodies, T-Shirts, Crewnecks & Sweatshirts, Quarter-Zips, Jackets & Fleece, Long-Sleeve Tees), an "In stock only" toggle, a sort menu (A-Z, price low to high, price high to low), a live "Showing X of Y" count, a "Clear filters" button, and an empty state. The catalogue has 22 inconsistent garment-type labels, so they get grouped into these 6 categories.
- **Why it helps:** 102 products in one long grid is hard to browse. Shoppers find "navy hoodie" or "Berkeley" in seconds, narrow to one kind of item, skip sold-out items, and sort by price. (The page has no price-range filter. Price-limit questions like "tees under $35" are answered by the chat.) Finding the right item faster means more sales.
- **Where to see it:** the Products page.
- **Status:** built and verified. In the running app: searching "hoodie" showed 26 of 102 products; a nonsense search showed the empty state; "Clear filters" restored all 102; the category pills show 29 / 27 / 25 / 11 / 8 / 2; sorting low-to-high ran from $32 to $58 and high-to-low the reverse; no console errors. **Bug found and fixed while testing:** the first version counted every "sweatshirt" as a T-shirt (T-Shirts showed 53, Crewnecks 1) because "sweatshirt" contains the letters "shirt". The rule now matches whole words only.

### 2. Conversation starters in the chat
- **What I added:** clickable suggestion chips in the chat widget ("What hoodies do you have?", "What would make a good gift for a parent?"). On a product page they become questions about that item ("What sizes are in stock?", "What colors does it come in?"). They disappear once a conversation exists, including a returning shopper's saved chat.
- **Why it helps:** a blank chat box makes people hesitate. One click starts a useful conversation, shows what the assistant can do, and leads to product cards.
- **Where to see it:** the chat button (bottom right) on any page.
- **Status:** built and verified. A guest sees 4 starters on any page. On a product page there are 3 starters about that item and the input placeholder reads "Ask about this item…". Clicking a starter sends it together with the product page context (the product id) and the starters disappear. They are shown only while the conversation is empty, so a returning shopper's reloaded chat doesn't show them (by design).

## Agent / backend improvements

### 3. Sensitive-data guard (safer and cheaper)
- **What I added:** `backend/guard.py` checks each chat message before it goes anywhere. A valid card number (passes the Luhn check), a Social Security number, or "my password / PIN / CVV is ..." gets an instant friendly warning. That message is **not** sent to the AI model and **not** saved to the database.
- **Why it helps:** shoppers sometimes paste card numbers or passwords into chat. Before the guard, the prompt only asked the model to ignore such data, but it still reached the model provider and the saved chat history. Now it stays on the server, and the guard saves a model call.
- **Limits:** it catches only recognizable patterns (a card number that passes the Luhn check, an SSN, "password / PIN / CVV is ...") and checks only the message being sent. A card number written out in words, or one that fails the check, is not caught, and earlier messages in a guest's browser history are not re-checked. The safety rules in the prompt remain as a second layer.
- **Where to see it:** paste a card number into the chat and the warning appears instantly.
- **Status:** built and verified. As the logged-in test user, a message with a valid test card number and a message "my password is hunter2" both got the safety reply instantly (0.00 s), called no tools, and added 0 rows to the saved chat history. 10 unit cases: card numbers (with spaces or dashes), an SSN, "password is ..." and "PIN: ..." were flagged; a number that fails the card check, an order number, a phone number, and normal shopping questions were not.

### 4. One-call product lookup tool, `get_product_snapshot` (faster, cheaper, more accurate)
- **What I added:** a new agent tool returning a product's description, colors, exact price, and stock for every size in one database read. The prompt tells the agent to prefer it when a question needs more than one fact. The chat response also lists `tools_used`, and each chat writes one server log line with the tools called, model requests, token counts and time (never the message text).
- **Why it helps:** "Do you have the Berkeley quarter zip in medium, and how much?" used to mean up to three separate tool calls (search, then a stock check, then a price check), and each tool call can add another model request that re-reads the conversation. One snapshot call replaces the stock and price calls, so there should be fewer model requests, which means faster and cheaper answers. This is reasoned, not benchmarked: I measured only the new behavior (one run), not the old one. Price and stock come from the same database read, so they can't disagree. The log lets the shop owner measure the real cost.
- **Where to see it:** ask a multi-fact question; the API response shows `tools_used` and the server log shows requests and tokens per chat.
- **Status:** built and verified. Asking "Do you have the Berkeley quarter zip in medium, and how much is it?" used `tools_used = [search_products, get_product_snapshot]`, and the reply ("$72.00, 25 available in medium") matches the database. The server log line read `requests=3 tokens_in=9664 tokens_out=166 ms=10512`. Price and stock now come from one lookup instead of separate price and stock calls. **Bug found and fixed while testing:** the usage log first failed because `result.usage` is a property in this PydanticAI version, not a method. An offline test caught it before any real chat.

## Corrections (2026-10-07, after re-checking this file)
- **Improvement 1:** the text claimed shoppers could find "tees under $35" on the Products page. The page has no price-range filter (only a price sort), so the claim now says so, and says price-limit questions are answered by the chat.
- **Improvement 3:** "Today the prompt only asks…" described the old behavior in the present tense, so it now says "Before the guard…". A **Limits** line was added: what the guard catches and what it doesn't.
- **Improvement 4:** "currently takes a search, a stock check and a price check" described the old behavior in the present tense, so it now says "used to mean up to three separate tool calls". The claim that answers are faster and cheaper is now labeled as reasoned, not benchmarked, because only the new behavior was measured (one run).
