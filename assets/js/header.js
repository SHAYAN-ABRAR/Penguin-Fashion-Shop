/* Penguin Fashion — header: bag and saved counts, the section you're in, the mobile menu and search. */

import { PRODUCTS, styleById, imageSrc } from "./catalog.js";
import { bag, saved } from "./store.js";
import { escapeHTML, formatPrice, plural, openModal, closeModal, setupModal } from "./ui.js";
import { run } from "./actions.js";
import { matchesQuery } from "./collection.js";

function initCounts() {
  const bagBadge = document.querySelector("[data-bag-count]");
  const bagLabel = document.querySelector("[data-bag-label]");
  const savedBadge = document.querySelector("[data-saved-count]");
  const savedLabel = document.querySelector("[data-saved-label]");
  const bagMenu = document.querySelector("[data-bag-menu-count]");
  const savedMenu = document.querySelector("[data-saved-menu-count]");

  function bump(badge) {
    badge.classList.remove("bump");
    void badge.offsetWidth; // restart the animation
    badge.classList.add("bump");
  }
  function updateBag(reason) {
    const n = bag.count();
    bagBadge.textContent = n > 99 ? "99+" : String(n);
    bagBadge.hidden = n === 0;
    bagLabel.textContent = n ? `Bag, ${plural(n, "item", "items")}` : "Bag, empty";
    bagMenu.textContent = n ? `(${n})` : "";
    if (reason === "add" || reason === "restore") bump(bagBadge);
  }
  function updateSaved(reason) {
    const n = saved.count();
    savedBadge.textContent = String(n);
    savedBadge.hidden = n === 0;
    savedLabel.textContent = n ? `Saved pieces, ${n}` : "Saved pieces, none yet";
    savedMenu.textContent = n ? `(${n})` : "";
    if (reason === "add") bump(savedBadge);
  }
  bag.subscribe(updateBag);
  saved.subscribe(updateSaved);
  updateBag();
  updateSaved();
}

/* Marks the nav link for the section in the middle of the screen. */
function initSectionHighlight() {
  const links = [...document.querySelectorAll("[data-section-link]")];
  if (!("IntersectionObserver" in window) || !links.length) return;
  const sections = links.map((link) => document.getElementById(link.getAttribute("data-section-link"))).filter(Boolean);
  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) visible.add(entry.target.id); else visible.delete(entry.target.id); });
    const current = sections.find((s) => visible.has(s.id));
    links.forEach((link) => {
      if (current && link.getAttribute("data-section-link") === current.id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => observer.observe(s));
}

function initMenu(search) {
  const sheet = document.querySelector("[data-menu-sheet]");
  setupModal(sheet);
  document.querySelector("[data-open-menu]").addEventListener("click", (event) => {
    openModal(sheet, { returnFocus: event.currentTarget, focus: sheet.querySelector("[data-autofocus]") });
  });
  sheet.addEventListener("click", (event) => {
    const link = event.target.closest("[data-menu-link]");
    if (link) {
      event.preventDefault();
      const hash = link.getAttribute("href");
      closeModal(sheet);
      window.setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) {
          window.location.hash = hash;
          target.scrollIntoView({ block: "start" });
        }
      }, 0);
      return;
    }
    if (event.target.closest("[data-menu-search]")) {
      closeModal(sheet);
      window.setTimeout(() => search.open(), 0);
      return;
    }
    const action = event.target.closest("[data-menu-action]");
    if (action) {
      // The action buttons carry data-open-* too; close the menu first so the next panel isn't stacked on it.
      closeModal(sheet);
    }
  });
}

function initSearch() {
  const toggle = document.querySelector("[data-search-toggle]");
  const panel = document.querySelector("[data-search-panel]");
  const form = panel.querySelector("[data-search-form]");
  const input = panel.querySelector("#site-search");
  const results = panel.querySelector("[data-search-results]");

  function renderResults() {
    const q = input.value.trim();
    if (!q) { results.innerHTML = ""; return; }
    const found = PRODUCTS.filter((p) => matchesQuery(p, q));
    results.innerHTML = found.length
      ? found.map((p) => `<button type="button" class="search-result" data-search-product="${p.id}">
          <img src="${imageSrc(p, 200)}" width="200" height="250" alt="">
          <span><span class="search-result-name">${escapeHTML(p.name)}</span><span class="search-result-meta">${escapeHTML(styleById[p.style].single)} · <span class="price">${formatPrice(p.price)}</span></span></span>
        </button>`).join("")
      : `<p class="search-empty">No pieces match “${escapeHTML(q)}”. Try a color such as yellow or navy, or a style such as puffer.</p>`;
  }

  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    input.focus();
    input.select();
    renderResults();
  }
  function close({ restoreFocus = true } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => (panel.hidden ? open() : close()));
  panel.querySelector("[data-search-close]").addEventListener("click", () => close());
  input.addEventListener("input", renderResults);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = input.value.trim();
    close({ restoreFocus: false });
    run("searchCollection", q);
  });
  results.addEventListener("click", (event) => {
    const item = event.target.closest("[data-search-product]");
    if (!item) return;
    close({ restoreFocus: false });
    run("openProduct", item.getAttribute("data-search-product"), toggle);
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); close({ restoreFocus: !!toggle.offsetParent }); }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close({ restoreFocus: false });
  });
  document.addEventListener("focusin", (event) => {
    if (!panel.hidden && !panel.contains(event.target) && event.target !== toggle) close({ restoreFocus: false });
  });
  return { open };
}

export function initHeader() {
  initCounts();
  initSectionHighlight();
  const search = initSearch();
  initMenu(search);
}
