# HW 4 — AI Prompts Log

Word-for-word log of every prompt Haby typed, grouped by problem.

## Setup (before Problem 1)

1. We're working in the HW4 folder, put a joke in there
2. Let me tell you the scenario we are working with. Recall everything we did in HW3
3. For the How we worked session, I want that to continue. Understood?
4. Campus Customs needs a real customer webiste with a chatbot. I need you to build a React + Vite TypeScript front end and a Python FastAPI backend whose brain is a PydanticAI agent. Shoppers should be able to browse products, create an account, chat about merch, see matching items appear on the page, and get honest ansewrs about price and stock from a local database. You are being given campus_customs.db with tables for the product catalogue inventory by size, and users (with hashed passwords). Product image file paths, are in teh catalogue table. Research yalebulldogblue.com to learn the style of Campus Customs page and information for my agent prompt. Use my PORTKEY_API_KEY Remember we are doing one problem at a time. In the end, you will push my project to a public GitHub repo and submit the repo URL for my assignment submission. The last problem will show the file tree. DO NOT commit the database or  product images.

## Problem 1: Vibe Coder Prompts

1. Problem 1: Vibe Coder Prompts
2. Download the zip called datahw4.zip in the AI Foundations folder. You should have data/campus_customs.db (SQLite database with tables catalogue, inventory, and users (one test user is already there), data/products/ product images; paths match teh catalogue table
3. Create AI_prompts.md at the start and update it as I go. The rest of the instructions are identical to the How We Worked session (number/title, feedback, etc)

Feedback from Haby: I asked my agent to review HW3 and we are on the same page. No additional prompts were needed.

## Problem 2: Analyze the Database

1. Look at the database data/campus_customs.db and look at the fields of each table. Especially the catalogue, inventory, and users. Create the file output/harness.md Write down each table and its fields, and one line of why each field matters for the shop and/or the chatbot. We will keep growing this harness file in later problems (models, tools, safety, specs)
2. One sec, this is Problem 2: Analyze the Database
3. That's all.

Feedback from Haby: Database has been analyzed. No additional prompts were needed.

## Problem 3: Build the Campus Customs Website

1. Problem 3: Build the Campus Customs Website
2. Scaffold a React +  Vite + TypeScript front end for Campus Customs. Put a nav bar at the top that links to the main pages: Home, Products, About Us, Log in, Create Account. Pull Campus Customs-style wording from yalebulldogblue.com for Home and About Us. I want the site  to have Yale blue colors, logos and theme
3. On the Products page, show product images from the catalogue (use the image paths in the database) with basic product info (name, price, short description). Make each product open a single-item page (large image on one side, full product text on the other - description, price, size/stock, when you have them). Clicking on the card on Products should take the shopper there etc. Add a chat interface in the BOTTOM RIGHT of the site (a floating chat panel is fine). It does not need to talk to an agent yet - a stub that will call your backend later is enough for this proble. You will need a small API very soon in order to be able to read the database. Im allowing you to start a simple FastAPI app in backend/main.py just to serve products and images, then grow it into the agent backend (we'll see in Prob 5)
4. Double check you've followed all my instructions. If there are any mistakes, fix it
5. All done

Feedback from Haby: I asked my agent to look over its work and verify it had followed all my instructions/didn't make any mistakes. It verified all is correct.

## Problem 4: Create Account and Login

1. Problem 4: Create Account and Login
2. I want you to build a normal create-account / login flow. In Create Account user should be able to have boxes for : First Name, Last Name, Email, Password, Confirm Password. It should also have a Log In option with boxes Email and Password. New accounts go into the users table. Make sure to store passwords securely so hackers (human or AI) cannot access them. The seed database already has a test user you can use while building. Email test@campuscustoms.yale.edu and Password password. Confirm that you can login as that user, and that a brand-new account you create also works. Update output/harness.md with how auth works (what you store for a user and how passwords are protected).

Feedback from Haby: There were no additional prompts that we needed. Based on the website image, the frontend is correct.

## Problem 5: PydanticAI Agent Backend

1. Problem 5: PydanticAI Agent Backend. Build the shop chatbot as a PydanticAI agent behind FastAPI, plugged into your frontend chat widget. Put the API app in backend/main.py - that is the file you run with Uvicorn. Keep the agent as these four files next to it (same idea as HW 3 - verify that you have looked through hw3 and understand what we are doing).  I want 4 things (1) backend/prompts/prompt.md - system prompt (grow this same file later). (2) backend/agent.py - agent entry/wiring. (3) backend/tools.py - tools the agent can call (4) backend/models.py - Pydantic / PydanticAI structured types. In main.py expose a chat route so a message from the website returns a reply from the agent (and whatever else you need for products/auth) You will need my AI model API key for the agent
2. WAIT HOLD ON ONE SECOND
3. I think there is a mistake. Didn't I already do HW4? We're you writing on top of HW4 from a few weeks ago? Or was the folder empty when you started?
4. Ok great. Lets continue with Problem 5
5. I want you to put Campus Customs voice and safety basics into prompts/prompt.md (you will expand tools and safety later). I want you to start or update types in models.py for chat replies / product cards as needed. In output/harness.md note how the front end talks to FastAPI and how the agent is loaded (prompt file + model). Make sure the backend runs from the backend/ folder like this: uvicorn main:app --reload --port 8000
6. How long did it take you to do Prob 5 and how many tokens?

Feedback from Haby: The agent took almost 5 minutes to do this problem and used almost 45k tokens. Going forward, in addition to checking for the agent's correctness, I will be monitoring token use to make sure it doesn't surpass a reasonable limit.

## Problem 6: Tools: Product Info and Stock

1. Problem 6: Tools: Product Info and Stock      I want you to use the tools you need to look up real information from campus_customs.db (1) Product Description (2) Price (3) How many are in stock by size. I need you to use the database NEVER EVER EVER invent prices or quantities. I rather you say Not Found or Out of Stock (whichever is correct) than invent. If a size is out of stock or not found SAY SO. Then, expand prompts/prompt.md so the agent knows to call these tools for price and stock questions. Add or update return types in models.py    Then in output/harness.md list each tool and explain which model fields you chose for lookup results and why
2. Double check your work top to bottom
3. Good job for not rewriting earlier text and writing a note instead, keep that up - always ask for permission
4. Also how much is 3k in dollars approximately

Feedback from Haby: Now my agent is automatically informing me of its token use. I have also asked it to tell me the total price. Just Problem 6 alone cost me almost 2 dollars. That is VERY expensive.  Every problem should only be costing me a few cents - at this rate, I will be out of money. My next prompt will be focused on cost-optimization. I know that agents are motivated by rewards, so I will give it a reward at the end if it, if it saves me money!

## Between Problems 6 and 7

1. Great, let's do that

## Problem 7: Chat Search That Updates The Page

1. Problem 7: Chat Search That Updates The Page     Now we will add a neat feature to the site. When a custom asks about a type of item - for example "what hoodies do you have" - you should search the catalogue and the website should dynamically show those matching items as product cards (image, price, name, short info). This is an API contract: the agent returns structured  product matches and then the frontend renders them on the website. I want it to look beautiful!!
2. After the dynamic product cards are loaded by your new feature, make sure the same single-item page behavior you built in Problem 3 still works: each product card - including the ones the chat just put on the page - should still open that detail view (large image + full info) when clicked. Update prompts/prompt.md and output/harness.md so it is clear how search results reach the page.
3. For my previous feedback, I want you to delete the sentence about changing from opus to sonnet costing more. Show me the full revised version
4. Great

Feedback from Haby: In terms of spending, my assignment is now costing a fraction of what it did before. My worry now is about the quality of the website. It mentioned there being a bug causing the blank page that it needed to fix. I will turn Opus on at the end, to ensure everything done by this cheaper model is correct and mistake-free.

## Problem 8: Customer Memory

1. Problem 8: Customer Memory    When a shopper is logged in, save their chat history in the database in an appropriate table and reload it when they return. The agent should KNOW WHO is chatting (name, email) - put that in agent deps (or an equivalent clear pattern) and/or tools the agent can call. Also pass enough page context that if someone is on product page and asks "do you have this in blue?" the agent knows which item they mean. HINT: you can put code into the agent context.
2. Guests can still chat, but history only needs to persist for logged-in users. Document in output/harness.md (how user chat history is stored, what customer fields the agent sees, and how page context is passed.
3. Are you done?
4. Double check there are no mistakes

Feedback from Haby: As expected, this model makes more mistakes. I needed to ask it to double check its work and ensure that its work is above board.

## Problem 9: Usability Improvements

1. Problem 9: Usability Improvements       Now that the core shop works, improve it. Choose and implement (1) 2 front-end usability improvements (2) 2 agent / backend usability improvements. Front-end improvements are things that make the agent output better, more accurate, or safer. These could be new agent tools or things that make the agent run faster and cheaper. Write output/usability.md BEFORE OR AS I BUILD. For each of the improvements, I want you to say: (1) What you added (2) Why it helps a Campus Customs shopper or the business. Then make sure all improvements actually show up in the running app. Graders will read the write-up and look for the features.          Problem 10: Style the Website    Add creative design so the site feels like a real Campus Customs storefront - fonts, color, hierachy, motion, product presentation, chat feel. I will get more points for imaginative and innovative design. I need this to look unlike any other similar project out there. I want it to be highly animative and fun and interactive.
2. Stop
3. Let's do it one at a time
4. Wait
5. Problem 9: Usability Improvements       Now that the core shop works, improve it. Choose and implement (1) 2 front-end usability improvements (2) 2 agent / backend usability improvements. Front-end improvements are things that make the agent output better, more accurate, or safer. These could be new agent tools or things that make the agent run faster and cheaper. Write output/usability.md BEFORE OR AS I BUILD. For each of the improvements, I want you to say: (1) What you added (2) Why it helps a Campus Customs shopper or the business. Then make sure all improvements actually show up in the running app. Graders will read the write-up and look for the features.
6. give me the link
7. These are great. Let's make sure these suggestions are written somewhere in output/usability.md so my grader knows. Then I want you to implement these

Feedback from Haby: This was a more costly session, because there were 2 live model calls which took a long time to process ($1.20). The balance I have been wanting to strike is between cost and quality. From my experience, as well as from information I've gathered conversing with peers, the cheaper models are mistake-prone. It becomes a question of how good are you at balancing your budget while optimizing for the best solution.
