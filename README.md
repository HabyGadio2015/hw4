# Campus Customs: a shop website with an AI shopping assistant (HW 4)

A class project: a storefront for a Yale-themed merchandise shop ("Yale Bulldog Blue by Campus Customs", 57 Broadway, New Haven) with a chatbot that answers price and stock questions from a real SQLite database. The shop is only a setting for the class; this project is not affiliated with Yale University or Campus Customs.

## What it does
- **Browse and find:** a product grid with search, category filters, sorting, and an in-stock toggle; a page for each item with a zoomable photo, real colors, and a size picker that shows the real stock.
- **Shop assistant (chat):** a PydanticAI agent that looks up descriptions, prices, and stock by size in the database. It says "Not Found" or "Out of Stock" instead of guessing, and it never invents a price or a quantity.
- **Search that updates the page:** ask "what hoodies do you have?" and matching products appear on the page as cards that open the item's page.
- **Accounts and memory:** create an account and log in (passwords are salted and slowly hashed); a logged-in shopper's chat is saved and comes back next visit, and the assistant knows who is chatting and which product page they are on.
- **Safety:** a guard that keeps card numbers, SSNs, and passwords away from the model, 13 safety rules in the agent's prompt, loop limits, and an append-only audit trail.
- **Storefront design:** awning, window display, pennants, a "Game Day" mode, a "Calm" mode that stops all motion, a bulldog chat helper, and more.

## The agent: four files under `backend/`
| File | Role |
|---|---|
| `backend/prompts/prompt.md` | The agent's system prompt: shop voice, honesty rules, how to use the tools, and 13 safety rules. It is one file that grows. |
| `backend/agent.py` | Agent entry and wiring: loads the prompt, builds the PydanticAI agent, runs a chat turn, and records it in the audit trail. |
| `backend/tools.py` | The agent's read-only database tools (search, description, price, stock by size, product snapshot) and the model setup. |
| `backend/models.py` | Every Pydantic type: products, chat messages, tool results, audit entries. |

`backend/main.py` is the FastAPI app: it exposes the chat route (plus products and accounts) and is the file you run with Uvicorn. Four small files support it: `auth.py` (sign-up and login), `memory.py` (saved chat), `guard.py` (the safety guard), and `audit.py` (the audit trail). `regression_check.py` is a test script.

## Local-only data pack (not in git)
The database and the product photos are not in this repository. They come from the course file `datahw4.zip`. Unzip it so that a `data/` folder sits next to `backend/` and `frontend/`:

```
hw4/
├── backend/
├── frontend/
├── data/                       #local only, not in git
│   ├── campus_customs.db
│   └── products/               #images referenced by the catalogue
```

Each product's `image_file_path` in the database (for example `products/basic-hoodie-big-yale.jpg`) points into `data/`. Your own `.env` (with your Portkey API key) is also local only; `.env.example` shows the format and holds placeholders only.

Without the data pack and a key you can still read the code, the documents, and the screenshots; you just can't run the site.

## Run it (after placing the data pack)
1. Clone this repository and open the folder (it is called `hw4`).
2. Place the data pack as shown above: `data/campus_customs.db` and `data/products/`.
3. Copy `.env.example` to `.env` (in the `hw4` folder) and set `PORTKEY_API_KEY`.
4. **Back end** (first terminal):
   ```
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r ../requirements.txt
   uvicorn main:app --reload --port 8000
   ```
   Check it: open http://127.0.0.1:8000/api/health. It should show `{"status":"ok"}`. If it stops at start-up complaining about a missing `data/products` folder, the data pack is not in place yet.
5. **Front end** (second terminal):
   ```
   cd frontend
   npm install
   npm run dev -- --port 5174
   ```
6. Open http://localhost:5174. The front end sends `/api` and `/media` requests to the back end on port 8000, so start the back end first.

Check that everything still works (no paid model calls; run `npm install` first): `cd backend && .venv/bin/python regression_check.py`

## Where to look
| File | What it is |
|---|---|
| `output/harness.md` | How the whole system works: model fields and why, tools, safety rules, specs, how to run (start with section 10) |
| `output/usability.md` | The four usability improvements, with what was added, why it helps, and test evidence |
| `output/design.md` | The 14 design changes ("I changed ... because ... It should help customers stick around and buy because ...") |
| `output/app_check.html` | The live-site check: screenshots with captions (open it in a browser) |
| `output/audit_trail.json` | The append-only audit trail of agent activity |
| `AI_prompts.md` | Every prompt used to build the project, by problem, with feedback |

## Layout
```
hw4/
├── AI_prompts.md
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── frontend/         #Vite React TypeScript app
├── backend/
│   ├── main.py         #FastAPI app - run with: uvicorn main:app --reload --port 8000
│   ├── agent.py        #agent file 1 of 4
│   ├── models.py       #agent file 2 of 4
│   ├── tools.py        #agent file 3 of 4
│   ├── prompts/
│   │   └── prompt.md   #agent file 4 of 4 (the system prompt, including its safety rules)
│   ├── auth.py  memory.py  guard.py  audit.py   #supporting files: accounts, saved chat, safety guard, audit trail
│   └── regression_check.py
├── output/
│   ├── harness.md  design.md  usability.md  audit_trail.json
│   ├── app_check.html
│   └── app_check_images/ #screenshots linked from app_check.html
```

## Limits
- The chat needs a Portkey API key and an internet connection. Its answers about price and stock come from database lookups, but wording can vary between runs.
- There is no checkout: the assistant cannot place orders or take payments.
- Built on a local development setup (the session cookie is not marked secure, and the rate limit is kept in memory).
