# Campus Customs: a shop website with an AI shopping assistant (HW 4)

A class project: a storefront for a Yale-themed merchandise shop ("Yale Bulldog Blue by Campus Customs", 57 Broadway, New Haven) with a chatbot that answers price and stock questions from a real SQLite database. The shop is only a setting for the class; this project is not affiliated with Yale University or Campus Customs.

## What it does
- **Browse and find:** a product grid with search, category filters, sorting, and an in-stock toggle; a page for each item with a zoomable photo, real colors, and a size picker that shows the real stock.
- **Shop assistant (chat):** a PydanticAI agent that looks up descriptions, prices, and stock by size in the database. It says "Not Found" or "Out of Stock" instead of guessing, and it never invents a price or a quantity.
- **Search that updates the page:** ask "what hoodies do you have?" and matching products appear on the page as cards that open the item's page.
- **Accounts and memory:** create an account and log in (passwords are salted and slowly hashed); a logged-in shopper's chat is saved and comes back next visit, and the assistant knows who is chatting and which product page they are on.
- **Safety:** a guard that keeps card numbers, SSNs, and passwords away from the model, 13 safety rules in the agent's prompt, loop limits, and an append-only audit trail.
- **Storefront design:** awning, window display, pennants, a "Game Day" mode, a "Calm" mode that stops all motion, a bulldog chat helper, and more.

## What is not in this repository
- **The database and product photos** (`data/campus_customs.db` and `data/products/`) come from the course file `datahw4.zip`.
- **Your own `.env`** with your Portkey API key. `.env.example` shows the format and holds placeholders only.

Without those two you can still read the code, the documents, and the screenshots; you just can't run the chat.

## Run it
1. Clone this repository and open the folder (it is called `hw4`).
2. Unzip `datahw4.zip` inside it, so `data/campus_customs.db` and `data/products/` exist.
3. Copy `.env.example` to `.env` and set `PORTKEY_API_KEY`.
4. Back end:
   ```
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r ../requirements.txt
   uvicorn main:app --reload --port 8000
   ```
5. Front end (in a second terminal):
   ```
   cd frontend
   npm install
   npm run dev -- --port 5174
   ```
6. Open http://localhost:5174

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
│   ├── agent.py        #the PydanticAI agent
│   ├── models.py       #all Pydantic types
│   ├── tools.py        #the agent's read-only database tools
│   ├── auth.py  memory.py  guard.py  audit.py   #accounts, saved chat, safety guard, audit trail
│   ├── regression_check.py
│   ├── prompts/
│   │   └── prompt.md   #the agent's system prompt, including its safety rules
├── output/
│   ├── harness.md  design.md  usability.md  audit_trail.json
│   ├── app_check.html
│   └── app_check_images/ #screenshots linked from app_check.html
```

## Limits
- The chat needs a Portkey API key and an internet connection. Its answers about price and stock come from database lookups, but wording can vary between runs.
- There is no checkout: the assistant cannot place orders or take payments.
- Built on a local development setup (the session cookie is not marked secure, and the rate limit is kept in memory).
