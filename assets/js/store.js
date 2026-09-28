/* Penguin Fashion — the bag and the wishlist, saved in this browser's localStorage.
 *
 *   penguin-fashion:cart:v1      {"v":1,"items":[{"id":"…","size":"M","qty":1}],"savedAt":"…"}
 *   penguin-fashion:wishlist:v1  {"v":1,"ids":["…"],"savedAt":"…"}
 *
 * Saved data is checked every time it's read: unreadable or older-format data is reset, products
 * or sizes that aren't in the catalog are dropped, quantities are kept between 1 and MAX_QUANTITY,
 * and repeated lines are merged. Prices are never stored; they always come from the catalog.
 * If the browser won't store anything, both stores keep working in memory for this visit. */

import { productById, sizesFor, MAX_QUANTITY } from "./catalog.js";

export const BAG_KEY = "penguin-fashion:cart:v1";
export const SAVED_KEY = "penguin-fashion:wishlist:v1";
const VERSION = 1;

function storageAvailable() {
  try {
    const probe = "penguin-fashion:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch (error) {
    return false;
  }
}

function readRaw(key) {
  try { return window.localStorage.getItem(key); } catch (error) { return null; }
}

function writeRaw(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

/* A tiny observable store shared by the bag and the wishlist. */
function createStore({ key, parse, serialize, isEmpty }) {
  let state = parse(null).state;
  let persistent = storageAvailable();
  let notices = [];
  const listeners = new Set();

  function notify(reason) { listeners.forEach((fn) => fn(reason)); }

  function save() {
    if (!persistent) return;
    const ok = writeRaw(key, isEmpty(state) ? null : JSON.stringify({ v: VERSION, ...serialize(state), savedAt: new Date().toISOString() }));
    if (!ok) { persistent = false; notices = notices.concat({ type: "unsaved" }); }
  }

  function load() {
    const result = parse(persistent ? readRaw(key) : null);
    state = result.state;
    if (result.notices.length) notices = notices.concat(result.notices);
    if (result.rewrite) save();
  }

  load();
  if (!persistent) notices = notices.concat({ type: "unavailable" });

  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) { load(); notify("external"); }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) { load(); notify("external"); }
  });

  return {
    get state() { return state; },
    set(next, reason) { state = next; save(); notify(reason); },
    get persistent() { return persistent; },
    takeNotices() { const n = notices; notices = []; return n; },
    peekNotices() { return notices.slice(); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

function parseEnvelope(raw) {
  if (raw === null || raw === "") return { empty: true };
  let data;
  try { data = JSON.parse(raw); } catch (error) { return { problem: "unreadable" }; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { problem: "unreadable" };
  if (data.v !== VERSION) return { problem: "outdated" };
  return { data };
}

/* The bag ------------------------------------------------------------------------------------- */

function parseBag(raw) {
  const envelope = parseEnvelope(raw);
  if (envelope.empty) return { state: [], notices: [], rewrite: false };
  if (envelope.problem) return { state: [], notices: [{ type: envelope.problem }], rewrite: true };
  const list = envelope.data.items;
  if (!Array.isArray(list)) return { state: [], notices: [{ type: "unreadable" }], rewrite: true };

  const items = [];
  let dropped = 0, invalid = 0, lowered = 0;
  list.forEach((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || typeof entry.size !== "string") { invalid += 1; return; }
    const product = productById[entry.id];
    if (!product) { dropped += 1; return; }
    if (!sizesFor(product).includes(entry.size)) { invalid += 1; return; }
    const qty = entry.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) { invalid += 1; return; }
    const existing = items.find((item) => item.id === entry.id && item.size === entry.size);
    if (existing) {
      const merged = existing.qty + qty;
      existing.qty = Math.min(merged, MAX_QUANTITY);
      if (merged > MAX_QUANTITY) lowered += 1;
      return;
    }
    if (qty > MAX_QUANTITY) lowered += 1;
    items.push({ id: entry.id, size: entry.size, qty: Math.min(qty, MAX_QUANTITY) });
  });

  const notices = [];
  if (dropped) notices.push({ type: "dropped", count: dropped });
  if (invalid) notices.push({ type: "invalid", count: invalid });
  if (lowered) notices.push({ type: "lowered", count: lowered });
  const rewrite = notices.length > 0 || items.length !== list.length;
  return { state: items, notices, rewrite };
}

const bagStore = createStore({
  key: BAG_KEY,
  parse: parseBag,
  serialize: (items) => ({ items }),
  isEmpty: (items) => items.length === 0,
});

const sameLine = (id, size) => (item) => item.id === id && item.size === size;

export const bag = {
  key: BAG_KEY,
  items: () => bagStore.state.map((item) => ({ ...item })),
  count: () => bagStore.state.reduce((sum, item) => sum + item.qty, 0),
  quantityOf: (id, size) => (bagStore.state.find(sameLine(id, size)) || { qty: 0 }).qty,
  subtotal: () => bagStore.state.reduce((sum, item) => sum + productById[item.id].price * item.qty, 0),
  get persistent() { return bagStore.persistent; },
  takeNotices: () => bagStore.takeNotices(),
  subscribe: (fn) => bagStore.subscribe(fn),

  /* Adds qty of a product in a size. Repeated additions of the same size go on one line. */
  add(id, size, qty = 1) {
    const product = productById[id];
    if (!product || !sizesFor(product).includes(size)) return { added: 0, qty: 0 };
    const items = bagStore.state.map((item) => ({ ...item }));
    const line = items.find(sameLine(id, size));
    const before = line ? line.qty : 0;
    const after = Math.min(before + qty, MAX_QUANTITY);
    if (after === before) return { added: 0, qty: before, atLimit: true };
    if (line) line.qty = after;
    else items.push({ id, size, qty: after });
    bagStore.set(items, "add");
    return { added: after - before, qty: after, atLimit: after === MAX_QUANTITY };
  },

  setQuantity(id, size, qty) {
    const next = Math.max(1, Math.min(MAX_QUANTITY, Math.round(qty)));
    const items = bagStore.state.map((item) => (item.id === id && item.size === size ? { ...item, qty: next } : { ...item }));
    bagStore.set(items, "quantity");
    return next;
  },

  /* Removes a line and returns what's needed to put it back where it was. */
  remove(id, size) {
    const index = bagStore.state.findIndex(sameLine(id, size));
    if (index === -1) return null;
    const removed = { ...bagStore.state[index], index };
    bagStore.set(bagStore.state.filter((item, i) => i !== index).map((item) => ({ ...item })), "remove");
    return removed;
  },

  restore(removed) {
    if (!removed || !productById[removed.id]) return;
    const items = bagStore.state.map((item) => ({ ...item }));
    const line = items.find(sameLine(removed.id, removed.size));
    if (line) line.qty = Math.min(line.qty + removed.qty, MAX_QUANTITY);
    else items.splice(Math.min(removed.index, items.length), 0, { id: removed.id, size: removed.size, qty: removed.qty });
    bagStore.set(items, "restore");
  },
};

/* The wishlist -------------------------------------------------------------------------------- */

function parseSaved(raw) {
  const envelope = parseEnvelope(raw);
  if (envelope.empty) return { state: [], notices: [], rewrite: false };
  if (envelope.problem) return { state: [], notices: [{ type: envelope.problem }], rewrite: true };
  const list = envelope.data.ids;
  if (!Array.isArray(list)) return { state: [], notices: [{ type: "unreadable" }], rewrite: true };
  const ids = [];
  let dropped = 0, invalid = 0;
  list.forEach((id) => {
    if (typeof id !== "string") { invalid += 1; return; }
    if (!productById[id]) { dropped += 1; return; }
    if (!ids.includes(id)) ids.push(id);
  });
  const notices = [];
  if (dropped) notices.push({ type: "dropped", count: dropped });
  if (invalid) notices.push({ type: "invalid", count: invalid });
  return { state: ids, notices, rewrite: notices.length > 0 || ids.length !== list.length };
}

const savedStore = createStore({
  key: SAVED_KEY,
  parse: parseSaved,
  serialize: (ids) => ({ ids }),
  isEmpty: (ids) => ids.length === 0,
});

export const saved = {
  key: SAVED_KEY,
  ids: () => savedStore.state.slice(),
  count: () => savedStore.state.length,
  has: (id) => savedStore.state.includes(id),
  get persistent() { return savedStore.persistent; },
  takeNotices: () => savedStore.takeNotices(),
  subscribe: (fn) => savedStore.subscribe(fn),

  /* Newest first, so the latest piece you saved is at the top of the list. */
  toggle(id) {
    if (!productById[id]) return false;
    const has = savedStore.state.includes(id);
    savedStore.set(has ? savedStore.state.filter((x) => x !== id) : [id].concat(savedStore.state), has ? "remove" : "add");
    return !has;
  },

  remove(id) {
    const index = savedStore.state.indexOf(id);
    if (index === -1) return null;
    savedStore.set(savedStore.state.filter((x) => x !== id), "remove");
    return { id, index };
  },

  restore(removed) {
    if (!removed || !productById[removed.id] || savedStore.state.includes(removed.id)) return;
    const ids = savedStore.state.slice();
    ids.splice(Math.min(removed.index, ids.length), 0, removed.id);
    savedStore.set(ids, "restore");
  },
};
