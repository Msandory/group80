# Northstar Order-Status Ledger — Dashboard + Chatbot

React + Vite frontend for the PLP "Northstar Sprint" assignment: a dashboard
of the mock stationery-retailer dataset with an order-status resolver
chatbot docked on the right.

## Run locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. VS Code's Live Preview extension isn't
needed for a Vite project — `npm run dev` gives you hot-reload on save,
which Live Preview doesn't do for React. Live Preview is really meant for
static HTML/CSS/JS files without a build step.

## Project structure

```
src/
  data/data.json         ← teammate's dataset, drop-in replaceable
  logic/
    resolver.js           ← router: small talk → order/product/customer lookup
    orderStatus.js         ← getOrderStatus(orderId) — real logic, not a stub
    productAvailability.js ← checkProductAvailability(query) — real logic, not a stub
    store.js               ← CRUD engine: addOrder, cancelOrder, addEscalationTicket + localStorage
    tickets.js              ← sanitizes chat text, builds escalation ticket objects
  components/
    Header.jsx
    ProductCatalog.jsx
    OrdersTable.jsx       ← highlights + scrolls to a card when the bot matches an order
    CreateOrderForm.jsx    ← manual "Create" — new order via a form
    TicketList.jsx         ← Order tickets + Product tickets, filterable by type
    ChatPanel.jsx         ← the chatbot: lookups, "cancel order ORD-..." (Update), auto-escalation (Create)
  App.jsx                 ← layout shell: dashboard + docked chat sidebar
  App.css                 ← all styling (ledger/chalkboard theme, ported from index.html)
scripts/
  testLogic.js             ← run with `npm run test:logic`
```

## The logic contract

`resolveQuery(message, data)` in `src/logic/resolver.js` is what the chat
panel calls. It's a router: it checks for small talk first, then an order
ID, then a product/SKU or stock-question phrasing, then a customer name —
and calls `getOrderStatus()` or `checkProductAvailability()` accordingly,
translating their result into the shape the UI expects (`reply`, `orderId`,
`status`, `matches`).

To improve matching (typos, more phrasing, better intent detection), edit
`orderStatus.js` / `productAvailability.js` directly, or the routing logic
in `resolver.js` — the UI doesn't need to change either way.

Run `npm run test:logic` to sanity-check the logic functions and the full
resolver pipeline against a handful of sample queries.

## Manual test script — CRUD demo (for the instructor)

Run `npm install && npm run dev`, open the app, and try these in order in
the chat panel on the right. Each row is one CRUD operation.

| # | Type in the chat box | What it demonstrates | Expected result |
|---|---|---|---|
| 1 | `Where is ORD-20260702-02?` | **Read** — order lookup | Bot replies with in-transit status; the matching row highlights in the Orders table |
| 2 | `do you have a metal ruler in stock` | **Read** — product lookup | Bot confirms the product and its price |
| 3 | `Amina Otieno` | **Read** — customer-name lookup | Bot resolves to her one order automatically |
| 4 | `George Mutua` then pick a suggestion chip *(only if that customer has 2+ orders — otherwise skip, most sample customers have exactly one)* | **Read** — ambiguous match | Bot asks which order and shows chip buttons; clicking one resolves it |
| 5 | `do you have a stapler in stock` | **Create** — auto-escalation ticket | Bot replies "couldn't find it... Logged as TCK-XXXX for follow-up." Scroll to **Support Tickets** → a new row appears, type `product availability`, status `escalated` |
| 6 | `do you guys sell staplers` (repeat #5 in different words) | **Create** — dedup check | No *new* ticket appears — same TCK-XXXX gets reused instead of creating a duplicate |
| 7 | `Where is ORD-99999999-99?` | **Create** — auto-escalation for a missing order | Same as #5 but ticket type is `order status` |
| 8 | Fill in the **Create Order** form (pick a customer, pick a product, submit) | **Create** — manual, via form | Success message with a new `ORD-<today>-01` ID; new row appears at the bottom of the Orders table with status `processing` |
| 9 | `cancel order <the ID from step 8>` | **Update** — cancel via chat command | Bot confirms cancellation; that order's row in the Orders table now shows status `cancelled` |
| 10 | `cancel order ORD-20260701-01` | **Update** — guard rail | Bot refuses: this order is already `delivered`, so it explains it can't be cancelled |
| 11 | Refresh the browser page | **Persistence** | The order created in #8 and the tickets from #5/#7 are still there — state is saved to `localStorage`, not just React memory |
| 12 | `asdkjfh nonsense query` | **Sanitization check** | Bot gives the generic "couldn't match that" reply — no ticket is created, since there's no real order/product signal to escalate. Confirms the bot isn't ticket-spamming on gibberish |

Steps 1–4 and 12 are also covered non-interactively by `npm run test:logic`
(see `scripts/testLogic.js`) — the table above is for demonstrating the
same logic live through the actual chat UI, plus the two write operations
(Create, Update) that only exist at the UI/store layer.

## Deploying for free

Any static host works since this builds to plain HTML/CSS/JS:
 Team I added this should there be a need to deploy our project to any live enviroment
- **Vercel** — easiest for a Vite project. Import the GitHub repo, it
  auto-detects Vite, no config needed.
- **Netlify** — same idea; build command `npm run build`, publish
  directory `dist`.
- **GitHub Pages** — works too, but needs a `base` path set in
  `vite.config.js` if the repo isn't served from the domain root.

Recommend Vercel or Netlify for this project — zero-config for Vite and
you get a live URL as soon as you connect the repo.
