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
