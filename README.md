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
  components/
    Header.jsx
    ProductCatalog.jsx
    OrdersTable.jsx       ← highlights + scrolls to a card when the bot matches an order
    TicketList.jsx
    ChatPanel.jsx         ← the chatbot, with loading/error/fallback states built in
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

## Deploying for free

Any static host works since this builds to plain HTML/CSS/JS:

- **Vercel** — easiest for a Vite project. Import the GitHub repo, it
  auto-detects Vite, no config needed.
- **Netlify** — same idea; build command `npm run build`, publish
  directory `dist`.
- **GitHub Pages** — works too, but needs a `base` path set in
  `vite.config.js` if the repo isn't served from the domain root.

Recommend Vercel or Netlify for this project — zero-config for Vite and
you get a live URL as soon as you connect the repo.
