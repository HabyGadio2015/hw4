# Design Proposals (Problem 10)

**Status (updated 2026-10-07): batches 1 and 2 are applied (entries 1 to 8, 11, 13, and part of 14). Entries 9, 10, and 12 are still proposed and will be built in batch 3.** Each entry is written in the requested form, "I changed ____ because ____". It becomes true when the change is applied, so every entry has a Status line that starts as *Proposed* and is updated to *Applied* (with a note on what was verified).

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
- It should help customers stick around and buy because a shop that looks and reads like a real campus store feels trustworthy, and clear big-to-small headings let people find products and prices quickly instead of leaving confused.
- **Needs your OK:** a font package has to be downloaded and installed (for example from the Fontsource collection on npm). I will ask before installing anything.
- **Status:** Applied (batch 1). The headlines now use a varsity slab font stack (Rockwell and similar fonts already on the computer) with a felt-letter look: white fill, dark stitched-style outline, gold drop shadow, and a dashed stitch line. Body text stays a clean sans-serif, and prices stay serif. **Difference from the proposal:** no font package was downloaded, so the look depends on the visitor having a slab font; Georgia is the fallback. Installing a web font would make it identical everywhere (needs your OK to download).

## Color

### 2. Locker-room palette and Game Day mode
- **I changed** the all-blue theme to Yale Blue plus warm locker-room cream, chalk white, and a gold-tan accent, and added a "Game Day" toggle that switches the site to a blue-and-crimson rivalry look with confetti, **because** one accent color teaches the eye where to look (prices, buttons, offers), the warm cream makes the blue feel richer than blue on white, and Game Day mode ties into the Harvard-Yale tee and the busiest shopping weeks of the year, and gives people something fun to share.
- It should help customers stick around and buy because a warm, distinctive look makes the shop memorable, and a Game Day mode gives fans a seasonal, fun reason to come back and shop for the big weekend.
- **Status:** Applied (batch 1). New cream, chalk, and brass-gold colors sit alongside Yale Blue. A Game Day toggle in the top bar switches the top bar, pennants, hero glow, and Game Day band to a blue-and-crimson look and fires a confetti burst. The choice is remembered. Checked in the browser: the toggle sets the Game Day theme, 70 confetti pieces appear, and turning it off restores the normal look.

## Hierarchy

### 3. The home page as a guided shop walk
- **I changed** the home page order to: window-display hero, then a "Find your college" picker, then a Game Day band, then a "Gifts for the family" picker (Student / Parent / Alum / Sibling), then a trust strip, **because** visitors arrive with different goals (their own college, the game, a gift for someone), guided paths mean they spend less time hunting, and each section has one clear job, so nothing competes for attention.
- It should help customers stick around and buy because each visitor sees a path that matches why they came (their college, the game, a gift), so they reach something they want to buy within a click or two.
- **Status:** Applied (batch 1). The home page now runs: shop-window hero, then Find your college, then the Game Day band, then Gifts for the whole family, then the trust strip. The gift cards open the chat and send a question (checked: the "For a parent" card sent "What are good Yale gifts for a parent visiting campus?").

## Motion

### 4. Awning, open sign, pennants, and reveals
- **I changed** the static header and sections to an awning that rolls down on arrival, an OPEN sign that flickers on, a pennant bunting border that sways gently, and sections that rise into place as you scroll, **because** the first two seconds decide whether a visitor feels they have walked into a real shop, and motion that draws the eye to new content makes the page feel alive without getting in the way.
- It should help customers stick around and buy because a lively, welcoming first impression makes visitors curious enough to keep scrolling, and the motion pulls their eyes toward new things to look at.
- **Status:** Applied (batch 1). A scalloped striped awning rolls down on load, an OPEN · 57 BROADWAY sign flickers like neon, 28 pennants sway under the menu bar, and the home sections rise into view as you scroll (all 4 sections revealed when scrolled in a real-size window).

### 5. Locker-door page changes and garment-shaped loading
- **I changed** the instant page jumps and the plain "Loading…" text to a short locker-door wipe between pages and grey hoodie-and-tee silhouettes while products load, **because** it makes the site feel fast and polished, and a shopper who sees shapes where products will appear knows something is coming instead of staring at a blank page.
- It should help customers stick around and buy because pages that feel fast, and placeholders that show where products will appear, keep people from giving up while they wait.
- **Status:** Applied (batch 2). Gray hoodie and tee shapes with a shimmer now show where products will appear while the list loads. Checked with a deliberately slowed product list: 8 placeholders appeared, then the 102 cards replaced them. Two locker doors slide open on every page change (checked: both doors exist, the animation runs, and the doors never block clicks). The doors rest open, so nothing is ever left covered, and Calm mode hides them.

## Product presentation

### 6. Hang-tag cards on a rail
- **I changed** the flat product cards to hang-tag cards: each item hangs from a rail, the price sits on a paper tag that swings on hover, sizes are stitched labels with a live stock meter ("Only 5 left"), and sold-out items get an animated rubber-stamp SOLD OUT, **because** shoppers see price and availability at a glance, the honest stock meter builds trust (it comes straight from the database), and a rail of hanging clothes looks like real retail instead of a spreadsheet of boxes.
- It should help customers stick around and buy because seeing price and honest stock at a glance builds trust, and knowing a size is in stock (or nearly gone) helps them decide to buy now.
- **Status:** Applied (batch 2). Product cards now hang from a clip on a rail, with a paper price tag that swings on hover, size chips (low stock in amber, out of stock struck through), a stock meter, and a stock line, all from the database (for example the Harvard-Yale tee reads "6 of 6 sizes in stock · low in some" because its L has 2 left). The products list API now includes the sizes. The animated SOLD OUT stamp is built but has not been seen live, because no product is sold out in the current data. While testing, the first hook drawing looked like a question mark, so it was replaced with a clip and string.

### 7. Tilt, shine, and quick view
- **I changed** the simple hover lift on cards to a gentle 3D tilt that follows the pointer, a light shine that sweeps across the garment, and a "Quick look" button that opens a pop-up with the details, **because** shoppers can inspect an item without leaving the list and losing their place, and the tilt and shine make clothing feel touchable.
- It should help customers stick around and buy because they can inspect and compare items without leaving the list, so they keep browsing instead of losing their place and leaving.
- **Status:** Applied (batch 2). The tilt and shine follow the mouse (checked: moving the pointer sets the tilt, leaving clears it). "Quick look" opens a pop-up with the name, price, colors, size chips, "See full details", and "Ask about this", and Esc closes it. Tilt is off for touch screens and in Calm mode.

### 8. An interactive product page
- **I changed** the product page image and size boxes to an image you can magnify by hovering, color dots built from the item's real colors, and a size selector whose stock bar animates when you choose a size, plus an "Ask about this item" button that opens the chat already pointed at that product, **because** the two biggest doubts when buying clothes are "what does it really look like?" and "is my size here?", and answering both on the spot (and one tap from the assistant) removes the reasons to leave.
- It should help customers stick around and buy because zooming in, seeing the real colors, and checking a size's stock on the spot answers the doubts that stop people from buying, with the assistant one tap away.
- **Status:** Applied (batch 2). Hovering the photo zooms in under the mouse. The product's real colors show as swatches with names (the Harvard-Yale tee shows heather gray, white, red, navy blue); they are not a picker, because there is one photo per product. Choosing a size animates the stock bar and shows the real number (L: "Only 2 left", XS: "25 in stock"; the bar is scaled so 25 fills it). "Ask the assistant about this item" opens the chat and sends a question with the product's page context (checked: the product id was sent).

## Chat feel

### 9. A bulldog helper with moods
- **I changed** the plain chat button and dots to an original bulldog-helper illustration (not the university's mascot) whose ears perk up while the shopper types, whose tail wags while it thinks, and whose paw prints walk across the typing indicator, **because** waiting for an answer feels shorter when something friendly is moving, and a character with personality makes people more willing to ask, which leads to more product matches.
- It should help customers stick around and buy because a friendly character makes asking questions feel easy, and getting quick answers is what turns browsing into buying.
- **Status:** Proposed.

### 10. Results that hang up on a rail
- **I changed** the way chat results appear (cards fading in) to cards that fly from the chat to a hanger rail on the page and swing into place, with a caption such as "Hung up 8 hoodies for you," **because** it makes the link between "I asked" and "the page changed" impossible to miss, and it turns the best moment of the experience (finding items) into a small celebration.
- It should help customers stick around and buy because the items they asked for appear on the page right away, so they can click straight through to buy instead of searching again.
- **Status:** Proposed.

## Interactive fun

### 11. Find your college
- **I changed** the generic category cards on the home page to a row of 14 residential-college shields: hovering shows the college color and how many items it has, and clicking filters the shop to that college, **because** many shoppers shop by identity ("my college"), so this is the fastest path to items they care about, and it is a feature other storefronts do not have.
- It should help customers stick around and buy because shoppers who see their own college first start with items that speak to them, which makes them far more likely to find something and buy it.
- **Status:** Applied (batch 1). The home page shows 14 college shields. Each shows how many catalogue items mention that college (for example Benjamin Franklin 3, Saybrook 3, Morse 2) and honestly says "No items yet" for Ezra Stiles, Pauli Murray, and Silliman. Clicking Morse opened the Products page with "morse" already searched and the 2 matching products. **Note:** the shield colors are illustrative, not the colleges' official colors, and the counts come from matching the college name in product names and descriptions.

### 12. Welcome to the team
- **I changed** the plain sign-up result to a short confetti burst and a "Welcome to the team, #4" jersey-number reveal, and a small jersey chip in the menu bar for logged-in shoppers, **because** a memorable welcome makes people feel they joined something, which brings them back, and it makes the logged-in state visible at a glance.
- It should help customers stick around and buy because a memorable welcome makes people feel they joined the team, which gives them a reason to log in and come back.
- **Status:** Proposed.

## Trust

### 13. A shop-card strip
- **I changed** the plain footer text to a shop-card strip with the real facts (57 Broadway, officially licensed, 30-day returns on unworn items, the order-help email) and a pin that bounces when it scrolls into view, **because** first-time shoppers need reasons to trust a store, and putting those facts where they can see them answers the "is this legit and what if it doesn't fit?" worry early.
- It should help customers stick around and buy because seeing the real address, official licensing, and easy returns early removes the fear of buying from an unknown store.
- **Status:** Applied (batch 1). The home page has a trust strip with the real facts (officially licensed, 30-day returns on unworn items with tags, 57 Broadway, the order-help email) and a bouncing pin. The page footer is unchanged.

## Accessibility and speed

### 14. Calm mode, contrast, and lazy loading
- **I changed** the motion settings so every animation uses only transform and opacity, stops when the visitor's device asks for reduced motion, and can be switched off with a visible "Calm mode" button, and I kept text contrast high and product images lazy-loaded, **because** a fun site is only good if it also stays fast on a phone and usable for people sensitive to motion or with low vision, which includes some of the parents and alumni who shop here.
- It should help customers stick around and buy because a site that stays fast and comfortable for everyone, including shoppers sensitive to motion or with low vision, doesn't push anyone away.
- **Status:** Partly applied (batch 1). Done: a visible "Calm mode" button that stops every animation and the confetti (checked: the awning and pennant animations switched to none), Calm mode starts on automatically for visitors whose device asks for reduced motion, and the animations added so far use only transform and opacity. Not yet done: a measured text-contrast check, which will happen when the remaining batches are finished.
