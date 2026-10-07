# Design Proposals (Problem 10)

**Status: suggestions only. The website has not been changed.** Each entry is written in the requested form, "I changed ____ because ____". It becomes true when the change is applied, so every entry has a Status line that starts as *Proposed* and will be updated to *Applied* (with a note on what was verified).

**The big idea: make the website feel like the real shop at 57 Broadway.** Instead of a generic blue web store, the site becomes a storefront: a striped awning, a window display, a lit OPEN sign, a rail of garments on hangers with paper price tags, felt-letter headlines with stitched edges, pennant bunting, and a bulldog helper in the chat. Every proposal below uses that one idea, so the site feels like a place and not a template.

**Rules for every entry:** original artwork only (no Yale or Campus Customs logos, and not the university's mascot); animations use only transform and opacity so they stay smooth; all motion stops for shoppers who prefer reduced motion; text keeps strong contrast.

| # | Area | Proposal (short) |
|---|---|---|
| 1 | Fonts | Varsity felt-letter headlines + clean text face |
| 2 | Color | Locker-room palette + "Game Day" mode |
| 3 | Hierarchy | Home page as a guided shop walk |
| 4 | Motion | Awning, open sign, swaying pennants, scroll reveals |
| 5 | Motion | Locker-door page wipes + garment-shaped loading |
| 6 | Product presentation | Hang-tag cards with live stock meter and SOLD OUT stamp |
| 7 | Product presentation | Tilt, shine and quick-view on hover |
| 8 | Product presentation | Interactive product page (magnifier, color dots, size meter) |
| 9 | Chat feel | Original bulldog helper with moods |
| 10 | Chat feel | Search results "hang up" on a rail on the page |
| 11 | Interactive | "Find your college" crest picker |
| 12 | Interactive | "Welcome to the team" jersey moment |
| 13 | Trust | Shop-card strip with address, returns, order help |
| 14 | Accessibility / speed | Calm mode, contrast, lazy loading |

---

## Fonts

### 1. Varsity headlines
- **I changed** the headline font (now a plain serif) to a collegiate slab or varsity display face, drawn as felt letters with a stitched outline, and paired it with a clean sans-serif for body text and a serif for prices, **because** big varsity lettering says "campus shop" the moment the page loads, it makes the page hierarchy obvious (shout, then explain, then price), and the calm body font keeps product details easy to read.
- **Needs your OK:** a font package has to be downloaded and installed (for example from the Fontsource collection on npm). I will ask before installing anything.
- **Status:** Proposed.

## Color

### 2. Locker-room palette and Game Day mode
- **I changed** the all-blue theme to Yale Blue plus warm locker-room cream, chalk white, and a gold-tan accent, and added a "Game Day" toggle that switches the site to a blue-and-crimson rivalry look with confetti, **because** one accent color teaches the eye where to look (prices, buttons, offers), the warm cream makes the blue feel richer than blue on white, and Game Day mode ties into the Harvard-Yale tee and the busiest shopping weeks of the year, and gives people something fun to share.
- **Status:** Proposed.

## Hierarchy

### 3. The home page as a guided shop walk
- **I changed** the home page order to: window-display hero, then a "Find your college" picker, then a Game Day band, then a "Gifts for the family" picker (Student / Parent / Alum / Sibling), then a trust strip, **because** visitors arrive with different goals (their own college, the game, a gift for someone), guided paths mean they spend less time hunting, and each section has one clear job, so nothing competes for attention.
- **Status:** Proposed.

## Motion

### 4. Awning, open sign, pennants, and reveals
- **I changed** the static header and sections to an awning that rolls down on arrival, an OPEN sign that flickers on, a pennant bunting border that sways gently, and sections that rise into place as you scroll, **because** the first two seconds decide whether a visitor feels they have walked into a real shop, and motion that draws the eye to new content makes the page feel alive without getting in the way.
- **Status:** Proposed.

### 5. Locker-door page changes and garment-shaped loading
- **I changed** the instant page jumps and the plain "Loading…" text to a short locker-door wipe between pages and grey hoodie-and-tee silhouettes while products load, **because** it makes the site feel fast and polished, and a shopper who sees shapes where products will appear knows something is coming instead of staring at a blank page.
- **Status:** Proposed.

## Product presentation

### 6. Hang-tag cards on a rail
- **I changed** the flat product cards to hang-tag cards: each item hangs from a rail, the price sits on a paper tag that swings on hover, sizes are stitched labels with a live stock meter ("Only 5 left"), and sold-out items get an animated rubber-stamp SOLD OUT, **because** shoppers see price and availability at a glance, the honest stock meter builds trust (it comes straight from the database), and a rail of hanging clothes looks like real retail instead of a spreadsheet of boxes.
- **Status:** Proposed.

### 7. Tilt, shine, and quick view
- **I changed** the simple hover lift on cards to a gentle 3D tilt that follows the pointer, a light shine that sweeps across the garment, and a "Quick look" button that opens a pop-up with the details, **because** shoppers can inspect an item without leaving the list and losing their place, and the tilt and shine make clothing feel touchable.
- **Status:** Proposed.

### 8. An interactive product page
- **I changed** the product page image and size boxes to an image you can magnify by hovering, color dots built from the item's real colors, and a size selector whose stock bar animates when you choose a size, plus an "Ask about this item" button that opens the chat already pointed at that product, **because** the two biggest doubts when buying clothes are "what does it really look like?" and "is my size here?", and answering both on the spot (and one tap from the assistant) removes the reasons to leave.
- **Status:** Proposed.

## Chat feel

### 9. A bulldog helper with moods
- **I changed** the plain chat button and dots to an original bulldog-helper illustration (not the university's mascot) whose ears perk up while the shopper types, whose tail wags while it thinks, and whose paw prints walk across the typing indicator, **because** waiting for an answer feels shorter when something friendly is moving, and a character with personality makes people more willing to ask, which leads to more product matches.
- **Status:** Proposed.

### 10. Results that hang up on a rail
- **I changed** the way chat results appear (cards fading in) to cards that fly from the chat to a hanger rail on the page and swing into place, with a caption such as "Hung up 8 hoodies for you," **because** it makes the link between "I asked" and "the page changed" impossible to miss, and it turns the best moment of the experience (finding items) into a small celebration.
- **Status:** Proposed.

## Interactive fun

### 11. Find your college
- **I changed** the generic category cards on the home page to a row of 14 residential-college shields: hovering shows the college color and how many items it has, and clicking filters the shop to that college, **because** many shoppers shop by identity ("my college"), so this is the fastest path to items they care about, and it is a feature other storefronts do not have.
- **Status:** Proposed.

### 12. Welcome to the team
- **I changed** the plain sign-up result to a short confetti burst and a "Welcome to the team, #4" jersey-number reveal, and a small jersey chip in the menu bar for logged-in shoppers, **because** a memorable welcome makes people feel they joined something, which brings them back, and it makes the logged-in state visible at a glance.
- **Status:** Proposed.

## Trust

### 13. A shop-card strip
- **I changed** the plain footer text to a shop-card strip with the real facts (57 Broadway, officially licensed, 30-day returns on unworn items, the order-help email) and a pin that bounces when it scrolls into view, **because** first-time shoppers need reasons to trust a store, and putting those facts where they can see them answers the "is this legit and what if it doesn't fit?" worry early.
- **Status:** Proposed.

## Accessibility and speed

### 14. Calm mode, contrast, and lazy loading
- **I changed** the motion settings so every animation uses only transform and opacity, stops when the visitor's device asks for reduced motion, and can be switched off with a visible "Calm mode" button, and I kept text contrast high and product images lazy-loaded, **because** a fun site is only good if it also stays fast on a phone and usable for people sensitive to motion or with low vision, which includes some of the parents and alumni who shop here.
- **Status:** Proposed.
