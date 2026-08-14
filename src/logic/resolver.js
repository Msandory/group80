/**
 * ─────────────────────────────────────────────────────────────────────────
 * LOGIC CONTRACT — resolveQuery() is what the chat panel calls per message.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This file is now wired to the real logic functions:
 *   - getOrderStatus(orderId)          → src/logic/orderStatus.js
 *   - checkProductAvailability(query)  → src/logic/productAvailability.js
 *
 * resolveQuery() itself is just a router: it looks at the message, decides
 * whether it's small talk, an order lookup, a product lookup, or a
 * customer-name lookup, calls the matching function, and translates that
 * function's result into the shape the UI expects.
 *
 * @param {string} message - raw text the user typed into the chat
 * @param {object} data - the full parsed data.json (products, customers,
 *                         orders, support_tickets)
 * @returns {Promise<BotResponse>}
 *
 * BotResponse shape (all fields optional except `reply`):
 * {
 *   reply: string,            // required — text shown in the chat bubble
 *   orderId: string | null,   // if set, the matching row is highlighted
 *                              // and scrolled into view in the Orders grid
 *   status: "resolved" | "no_match" | "ambiguous" | "error",
 *   matches: string[]         // order_ids, only used when status is "ambiguous"
 * }
 *
 * Throw an Error (or return a rejected promise) for a hard failure —
 * the chat panel already renders a fallback bubble for that case.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { getOrderStatus } from "./orderStatus.js";
import { checkProductAvailability } from "./productAvailability.js";

const ORDER_ID_PATTERN = /ORD-\d{8}-\d{2}/i;
const SKU_PATTERN = /\b[A-Z]{2}-\d{3}\b/i;
const PRODUCT_INTENT_PATTERN =
  /\b(do you have|is there|in stock|stock|available|availability|sell|carry)\b/i;

export async function resolveQuery(message, data) {
  const text = message.toLowerCase().trim();

  const smallTalk = matchSmallTalk(text);
  if (smallTalk) return smallTalk;

  // 1. Order lookup — explicit order ID present.
  const orderIdMatch = message.match(ORDER_ID_PATTERN);
  if (orderIdMatch) {
    return mapOrderResult(getOrderStatus(orderIdMatch[0]));
  }

  // 2. Product lookup — a SKU, or language suggesting a stock question.
  const skuMatch = message.match(SKU_PATTERN);
  if (skuMatch) {
    return mapProductResult(checkProductAvailability(skuMatch[0]));
  }
  if (PRODUCT_INTENT_PATTERN.test(text)) {
    const productQuery = extractProductQuery(text);
    const result = checkProductAvailability(productQuery);
    if (result.success && result.found) return mapProductResult(result);
    // Fall through — the intent phrase matched but extraction may have
    // left junk words in the query. Try the customer-name branch, then
    // the bare-product-name fallback at the end, before giving up.
  }

  // 3. Customer-name lookup — find that customer's order(s).
  const customerMatch = data.customers.find((c) =>
    text.includes(c.name.toLowerCase().split(" ")[0])
  );
  if (customerMatch) {
    const custOrders = data.orders.filter(
      (o) => o.customer_id === customerMatch.customer_id
    );
    if (custOrders.length === 1) {
      return mapOrderResult(getOrderStatus(custOrders[0].order_id));
    }
    if (custOrders.length > 1) {
      return {
        reply: `${customerMatch.name} has ${custOrders.length} orders on file. Which order ID do you mean?`,
        orderId: null,
        status: "ambiguous",
        matches: custOrders.map((o) => o.order_id),
      };
    }
  }

  // 4. Last resort — try the message itself (cleaned of punctuation and
  // question-y filler) as a product name. Covers a bare product name with
  // no "do you have" phrasing at all, e.g. just "A4 Exercise Book".
  const bareProductQuery = extractProductQuery(text);
  if (bareProductQuery) {
    const result = checkProductAvailability(bareProductQuery);
    if (result.success && result.found) return mapProductResult(result);
  }

  return {
    reply:
      "I couldn't match that to an order or product. Try an order ID (e.g. ORD-20260701-01), a product name/SKU, or a customer name.",
    orderId: null,
    status: "no_match",
  };
}

// ── Result mappers: translate the logic functions' return shape into ──
// ── the BotResponse shape the chat UI expects.                       ──

function mapOrderResult(result) {
  if (result.success) {
    return { reply: result.message, orderId: result.orderId, status: "resolved" };
  }
  return { reply: result.message, orderId: null, status: "no_match" };
}

function mapProductResult(result) {
  if (result.success && result.found) {
    return { reply: result.message, orderId: null, status: "resolved" };
  }
  // success:true + found:false → the catalog was searched but nothing
  // matched; success:false → bad input. Both read as "no_match" to the UI.
  return { reply: result.message, orderId: null, status: "no_match" };
}

// Strips common question/stock phrasing so "is the a4 exercise book
// available?" becomes "a4 exercise book", which matches better against
// product names in checkProductAvailability's substring search. Uses its
// own global regex (separate from PRODUCT_INTENT_PATTERN, which is reused
// with .test() and must stay non-global to avoid lastIndex state bugs).
const FILLER_WORDS_GLOBAL =
  /\b(do you have|is there|in stock|stock|available|availability|sell|carry|is|are|there|the|a|an|any)\b/gi;

function extractProductQuery(text) {
  return text
    .replace(FILLER_WORDS_GLOBAL, " ")
    .replace(/[?.!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Small talk ──────────────────────────────────────────────────────
// Regex-based on purpose, so it's cheap and has zero false-positive risk
// against order IDs or SKUs. Checked first so "hi, where's my order?"
// still falls through to order matching (only exact greeting-only
// messages match here).
const SMALL_TALK = [
  {
    test: (t) => /^(hi|hello|hey|hiya|yo|sup|good (morning|afternoon|evening))[!., ]*$/.test(t),
    reply:
      "Hey! I can look up an order or check product stock — send an order ID (e.g. ORD-20260701-01), a product name, or a customer name.",
  },
  {
    test: (t) => /\b(thanks|thank you|thx|cheers|appreciate it)\b/.test(t),
    reply: "You're welcome! Anything else I can look up for you?",
  },
  {
    test: (t) => /^(bye|goodbye|see ya|later|that'?s all)[!., ]*$/.test(t),
    reply: "Sounds good — come back anytime you need an order status.",
  },
  {
    test: (t) => /\b(help|what can you do|how does this work)\b/.test(t),
    reply:
      "I can check order status and product availability. Try an order ID, a product name, or a customer name.",
  },
  {
    test: (t) => /^(who are you|what are you)\??$/.test(t),
    reply: "I'm the Northstar order-status assistant — ask me about any order or product.",
  },
];

function matchSmallTalk(text) {
  const hit = SMALL_TALK.find((entry) => entry.test(text));
  if (!hit) return null;
  return { reply: hit.reply, orderId: null, status: "resolved" };
}
