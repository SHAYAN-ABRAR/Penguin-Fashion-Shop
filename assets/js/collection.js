/* Penguin Fashion — the collection: search, filters, sorting and the product grid.
 * The current search, filters and sort are kept in the address (?q=&style=&fit=&hooded=1&sort=&edit=),
 * so they survive a refresh and the back button, and closing a product leaves them untouched. */

import { PRODUCTS, STYLES, FITS, EDITS, productById, styleById, fitById, editById, imageSrc, imageSrcset } from "./catalog.js";
import { saved } from "./store.js";
import { escapeHTML, formatPrice, icon, pad2, plural, announce, toast, reduceMotion } from "./ui.js";
import { provide, run } from "./actions.js";

const DEFAULTS = { q: "", style: "all", fit: "all", hooded: false, sort: "featured", edit: "" };
const SORTS = {
  featured: (a, b) => a.number - b.number,
  "price-asc": (a, b) => a.price - b.price || a.number - b.number,
  "price-desc": (a, b) => b.price - a.price || a.number - b.number,
};
const SORT_LABELS = { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low" };

let state = { ...DEFAULTS };
let els = {};

/* Matching ------------------------------------------------------------------------------------- */
const fold = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function haystack(product) {
  return fold([product.name, product.color.name, styleById[product.style].label, styleById[product.style].single].join(" "));
}

export function matchesQuery(product, query) {
  const words = fold(query).split(/[^a-z0-9']+/).filter(Boolean);
  if (!words.length) return true;
  const text = haystack(product);
  return words.every((word) => text.includes(word));
}

function matches(product, s, ignore = "") {
  if (s.edit && ignore !== "edit" && !editById[s.edit].products.includes(product.id)) return false;
  if (ignore !== "q" && !matchesQuery(product, s.q)) return false;
  if (ignore !== "style" && s.style !== "all" && product.style !== s.style) return false;
  if (ignore !== "fit" && s.fit !== "all" && product.fit !== s.fit) return false;
  if (ignore !== "hooded" && s.hooded && !product.hooded) return false;
  return true;
}

export function visibleProducts(s = state) {
  return PRODUCTS.filter((p) => matches(p, s)).sort(SORTS[s.sort] || SORTS.featured);
}

/* Address -------------------------------------------------------------------------------------- */
function readURL() {
  const params = new URLSearchParams(window.location.search);
  const next = { ...DEFAULTS };
  next.q = (params.get("q") || "").slice(0, 60);
  const style = params.get("style");
  if (style && styleById[style]) next.style = style;
  const fit = params.get("fit");
  if (fit && fitById[fit]) next.fit = fit;
  next.hooded = params.get("hooded") === "1";
  const sort = params.get("sort");
  if (sort && SORTS[sort]) next.sort = sort;
  const edit = params.get("edit");
  if (edit && editById[edit]) next.edit = edit;
  return next;
}

function writeURL() {
  const params = new URLSearchParams(window.location.search);
  ["q", "style", "fit", "hooded", "sort", "edit"].forEach((key) => params.delete(key));
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.style !== "all") params.set("style", state.style);
  if (state.fit !== "all") params.set("fit", state.fit);
  if (state.hooded) params.set("hooded", "1");
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.edit) params.set("edit", state.edit);
  const query = params.toString();
  const url = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
  try { window.history.replaceState(window.history.state, "", url); } catch (error) { /* ignore */ }
}

/* Cards ---------------------------------------------------------------------------------------- */
export function productHref(product) {
  return `?product=${encodeURIComponent(product.id)}`;
}

function productCard(product, index) {
  const style = styleById[product.style];
  const fit = fitById[product.fit];
  const eager = index < 3 ? 'loading="eager"' : 'loading="lazy"';
  return `<li class="product-card" data-product-id="${product.id}">
    <div class="card-media">
      <img src="${imageSrc(product, 400)}" srcset="${imageSrcset(product)}"
           sizes="(min-width: 1320px) 400px, (min-width: 1024px) 30vw, (min-width: 340px) 46vw, 92vw"
           width="400" height="500" alt="${escapeHTML(product.alt)}" ${eager} decoding="async">
      <span class="card-number" aria-hidden="true">No. ${pad2(product.number)}</span>
      <button type="button" class="save-toggle card-save" data-save-toggle="${product.id}" aria-pressed="${saved.has(product.id)}">
        ${icon("heart")}<span class="visually-hidden">Save ${escapeHTML(product.name)}</span>
      </button>
    </div>
    <div class="card-body">
      <p class="card-meta">${escapeHTML(style.single)} · ${escapeHTML(fit.label)}</p>
      <h3 class="card-title"><a class="card-link" href="${productHref(product)}" data-open-product="${product.id}">${escapeHTML(product.name)}</a></h3>
      <p class="card-color"><span class="swatch" style="background:${product.color.swatch}"></span>${escapeHTML(product.color.name)}</p>
      <div class="card-foot">
        <p class="card-price price">${formatPrice(product.price)}</p>
        <span class="card-cta" aria-hidden="true"><span class="label label-long">View details</span><span class="label label-short">View</span>${icon("arrowRight")}</span>
      </div>
    </div>
  </li>`;
}

/* Filter controls, rendered twice: inline on wide screens and in the filter sheet on small ones. */
function countFor(key, value) {
  const trial = { ...state, [key]: value };
  return PRODUCTS.filter((p) => matches(p, trial)).length;
}

function chip({ type, name, value, label, checked, count }) {
  return `<label class="chip"><input type="${type}" name="${name}" value="${value}"${checked ? " checked" : ""}>${escapeHTML(label)}${
    count === undefined ? "" : ` <span class="count" aria-hidden="true">${count}</span>`}</label>`;
}

function filterGroupsHTML(prefix) {
  const styleChips = [{ id: "all", label: "All" }].concat(STYLES).map((s) =>
    chip({ type: "radio", name: `${prefix}-style`, value: s.id, label: s.label, checked: state.style === s.id, count: countFor("style", s.id) })).join("");
  const fitChips = [{ id: "all", label: "All" }].concat(FITS).map((f) =>
    chip({ type: "radio", name: `${prefix}-fit`, value: f.id, label: f.label, checked: state.fit === f.id, count: countFor("fit", f.id) })).join("");
  const hoodChip = chip({ type: "checkbox", name: `${prefix}-hooded`, value: "1", label: "Hooded", checked: state.hooded, count: countFor("hooded", true) });
  return `
    <fieldset class="filter-group" data-group="style"><legend class="field-label">Style</legend><div class="chip-row">${styleChips}</div></fieldset>
    <fieldset class="filter-group" data-group="fit"><legend class="field-label">Fit</legend><div class="chip-row">${fitChips}</div></fieldset>
    <fieldset class="filter-group" data-group="hooded"><legend class="field-label">Details</legend><div class="chip-row">${hoodChip}</div></fieldset>`;
}

function renderFilterGroups() {
  document.querySelectorAll("[data-filter-groups]").forEach((container) => {
    const prefix = container.getAttribute("data-filter-groups");
    // Keep focus on the same chip when the counts are refreshed.
    const active = document.activeElement;
    const focused = active && container.contains(active) ? { name: active.name, value: active.value } : null;
    container.innerHTML = filterGroupsHTML(prefix);
    if (focused) {
      const again = container.querySelector(`input[name="${focused.name}"][value="${focused.value}"]`);
      if (again) again.focus({ preventScroll: true });
    }
  });
  const sortChips = document.querySelector("[data-sort-chips]");
  if (sortChips) {
    const active = document.activeElement;
    const hadFocus = active && sortChips.contains(active) ? active.value : null;
    sortChips.innerHTML = Object.keys(SORTS).map((key) =>
      chip({ type: "radio", name: "sheet-sort", value: key, label: SORT_LABELS[key], checked: state.sort === key })).join("");
    if (hadFocus) { const again = sortChips.querySelector(`input[value="${hadFocus}"]`); if (again) again.focus({ preventScroll: true }); }
  }
}

function activeFilters() {
  const list = [];
  if (state.edit) list.push({ key: "edit", label: editById[state.edit].title });
  if (state.q.trim()) list.push({ key: "q", label: `“${state.q.trim()}”` });
  if (state.style !== "all") list.push({ key: "style", label: styleById[state.style].label });
  if (state.fit !== "all") list.push({ key: "fit", label: fitById[state.fit].label });
  if (state.hooded) list.push({ key: "hooded", label: "Hooded" });
  return list;
}

/* Render --------------------------------------------------------------------------------------- */
function render({ grid = true } = {}) {
  const list = visibleProducts();
  const total = PRODUCTS.length;
  const active = activeFilters();

  if (grid) els.grid.innerHTML = list.map(productCard).join("");
  els.grid.hidden = list.length === 0;
  els.noResults.hidden = list.length !== 0;
  if (!list.length) {
    els.noResultsText.textContent = state.q.trim()
      ? `No pieces match “${state.q.trim()}” with these filters. Try another word or clear the filters.`
      : "No pieces match these filters. Clear one, or clear them all to see every piece.";
  }

  const shown = list.length === total && !active.length
    ? `Showing all <strong>${total}</strong> pieces`
    : `Showing <strong>${list.length}</strong> of ${total} pieces`;
  els.count.innerHTML = shown;

  els.active.hidden = active.length === 0;
  els.active.innerHTML = active.map((f) =>
    `<li><button type="button" class="tag" data-remove-filter="${f.key}">${escapeHTML(f.label)}${icon("close")}<span class="visually-hidden">, remove this filter</span></button></li>`).join("");
  document.querySelectorAll("[data-clear-filters]").forEach((b) => {
    if (b.classList.contains("clear-all")) b.hidden = active.length === 0;
  });

  const filterCount = active.filter((f) => f.key !== "q").length;
  els.filtersCount.hidden = filterCount === 0;
  els.filtersCount.textContent = filterCount;
  els.filtersButton.setAttribute("aria-label", filterCount ? `Filters, ${filterCount} active` : "Filters");

  if (els.search.value !== state.q) els.search.value = state.q;
  els.sort.value = state.sort;
  renderFilterGroups();
  const applyButton = document.querySelector("[data-filter-apply]");
  if (applyButton) applyButton.textContent = list.length ? `Show ${plural(list.length, "piece", "pieces")}` : "No pieces match";
  writeURL();
}

function update(changes, { announceResult = true } = {}) {
  state = { ...state, ...changes };
  render();
  if (announceResult) {
    const n = visibleProducts().length;
    announce(n ? `${plural(n, "piece", "pieces")} shown.` : "No pieces match. Clear a filter to see more.");
  }
}

function scrollToCollection({ focusHeading = true } = {}) {
  const section = document.getElementById("collection");
  section.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  if (focusHeading) document.getElementById("collection-title").focus({ preventScroll: true });
}

/* Public actions -------------------------------------------------------------------------------- */
function applyEdit(editId) {
  if (!editById[editId]) return;
  state = { ...DEFAULTS, sort: state.sort, edit: editId };
  render();
  scrollToCollection();
  announce(`Showing ${editById[editId].title}: ${plural(visibleProducts().length, "piece", "pieces")}.`);
}

function applyStyle(styleId) {
  state = { ...DEFAULTS, sort: state.sort, style: styleById[styleId] ? styleId : "all" };
  render();
  scrollToCollection();
  announce(`Showing ${styleById[styleId] ? styleById[styleId].label.toLowerCase() : "all pieces"}: ${plural(visibleProducts().length, "piece", "pieces")}.`);
}

function searchCollection(query) {
  state = { ...state, q: String(query || "").slice(0, 60), edit: "" };
  render();
  scrollToCollection();
  const n = visibleProducts().length;
  announce(n ? `${plural(n, "piece", "pieces")} match “${state.q}”.` : `No pieces match “${state.q}”.`);
}

function clearAll() {
  state = { ...DEFAULTS };
  render();
}

/* Init ----------------------------------------------------------------------------------------- */
export function initCollection() {
  els = {
    grid: document.querySelector("[data-product-grid]"),
    noResults: document.querySelector("[data-no-results]"),
    noResultsText: document.querySelector("[data-no-results-text]"),
    count: document.querySelector("[data-results-count]"),
    active: document.querySelector("[data-active-filters]"),
    search: document.getElementById("collection-search"),
    sort: document.getElementById("collection-sort"),
    filtersButton: document.querySelector("[data-open-filters]"),
    filtersCount: document.querySelector("[data-filters-count]"),
  };
  state = readURL();

  const countWord = document.querySelector("[data-count-word]");
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  if (countWord) countWord.textContent = words[PRODUCTS.length] || String(PRODUCTS.length);

  // Inline and sheet filter chips share one handler.
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.name) return;
    const match = input.name.match(/^(inline|sheet)-(style|fit|hooded)$/);
    if (match) {
      const key = match[2];
      update({ [key]: key === "hooded" ? input.checked : input.value });
      return;
    }
    if (input.name === "sheet-sort") update({ sort: input.value });
  });

  let searchTimer;
  els.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => update({ q: els.search.value }), 140);
  });
  document.querySelector("[data-filter-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(searchTimer);
    update({ q: els.search.value });
  });
  els.sort.addEventListener("change", () => update({ sort: els.sort.value }));

  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-filter]");
    if (remove) {
      const key = remove.getAttribute("data-remove-filter");
      const reset = key === "q" ? "" : key === "hooded" ? false : key === "edit" ? "" : "all";
      const index = [...els.active.querySelectorAll("[data-remove-filter]")].indexOf(remove);
      update({ [key]: reset });
      // Keep focus in the list of tags, or on the search box when the last one goes.
      const tags = els.active.querySelectorAll("[data-remove-filter]");
      (tags[Math.min(index, tags.length - 1)] || els.search).focus({ preventScroll: true });
      return;
    }
    const clear = event.target.closest("[data-clear-filters]");
    if (clear) {
      clearAll();
      announce("Filters cleared. Showing all pieces.");
      if (!clear.closest("dialog")) els.search.focus({ preventScroll: true });
      return;
    }
    const shopEdit = event.target.closest("[data-shop-edit]");
    if (shopEdit) { applyEdit(shopEdit.getAttribute("data-shop-edit")); return; }
    const styleLink = event.target.closest("[data-apply-style]");
    if (styleLink) { applyStyle(styleLink.getAttribute("data-apply-style")); return; }
    const toggle = event.target.closest("[data-save-toggle]");
    if (toggle) {
      const id = toggle.getAttribute("data-save-toggle");
      const product = productById[id];
      const nowSaved = saved.toggle(id);
      if (!toggle.closest("dialog")) {
        toast(nowSaved
          ? { title: "Saved", text: `${product.name} is in your saved pieces.`, image: imageSrc(product, 200), action: { label: "View saved", onClick: () => run("openSaved", document.querySelector("[data-open-saved]")) } }
          : { title: "Removed from saved", text: product.name, image: imageSrc(product, 200), action: { label: "Undo", onClick: () => { if (!saved.has(id)) saved.toggle(id); } } });
      }
    }
  });

  // Every heart for a product reflects the saved list, wherever it is on the page.
  saved.subscribe(() => {
    document.querySelectorAll("[data-save-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(saved.has(button.getAttribute("data-save-toggle"))));
    });
  });

  window.addEventListener("popstate", () => {
    const next = readURL();
    if (JSON.stringify(next) !== JSON.stringify(state)) { state = next; render(); }
  });

  provide("applyEdit", applyEdit);
  provide("applyStyle", applyStyle);
  provide("searchCollection", searchCollection);
  provide("scrollToCollection", scrollToCollection);
  provide("productHref", productHref);
  render();
}
