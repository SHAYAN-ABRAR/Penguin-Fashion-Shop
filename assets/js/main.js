/* Penguin Fashion — entry point. Sets up each part of the page and routes clicks on shared triggers
 * (open a product, the bag, saved pieces, the size guide, the filters) to the right module. */

import { initCollection } from "./collection.js";
import { initHero } from "./hero.js";
import { initHeader } from "./header.js";
import { initLookbook } from "./lookbook.js";
import { initSizeGuide } from "./size-guide.js";
import { initBagDrawer } from "./bag-drawer.js";
import { initSavedDrawer } from "./saved-drawer.js";
import { initProductView } from "./product-view.js";
import { openModal, setupModal } from "./ui.js";
import { run } from "./actions.js";

function invokerFor(trigger) {
  // Buttons inside the mobile menu close it first, so focus should come back to the menu button.
  return trigger.closest("[data-menu-sheet]") ? document.querySelector("[data-open-menu]") : trigger;
}

function initTriggers() {
  const filterSheet = document.querySelector("[data-filter-sheet]");
  setupModal(filterSheet);

  document.addEventListener("click", (event) => {
    const productTrigger = event.target.closest("[data-open-product]");
    if (productTrigger) {
      // Let modified clicks open the product link in a new tab or window.
      if (productTrigger.tagName === "A" && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1)) return;
      event.preventDefault();
      run("openProduct", productTrigger.getAttribute("data-open-product"), invokerFor(productTrigger));
      return;
    }
    const bagTrigger = event.target.closest("[data-open-bag]");
    if (bagTrigger) { run("openBag", invokerFor(bagTrigger)); return; }
    const savedTrigger = event.target.closest("[data-open-saved]");
    if (savedTrigger) { run("openSaved", invokerFor(savedTrigger)); return; }
    const guideTrigger = event.target.closest("[data-open-size-guide]");
    if (guideTrigger) { run("openSizeGuide", { invoker: invokerFor(guideTrigger) }); return; }
    const filtersTrigger = event.target.closest("[data-open-filters]");
    if (filtersTrigger) { openModal(filterSheet, { returnFocus: filtersTrigger, focus: filterSheet.querySelector("[data-autofocus]") }); return; }
    const faqLink = event.target.closest("[data-open-faq]");
    if (faqLink) {
      const item = document.getElementById(faqLink.getAttribute("data-open-faq"));
      if (item) item.open = true;
    }
  });

  // A link straight to one question (for example #faq-bag) opens it.
  const openFromHash = () => {
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target && target.tagName === "DETAILS") target.open = true;
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
}

function start() {
  initCollection();
  initHero();
  initHeader();
  initLookbook();
  initSizeGuide();
  initBagDrawer();
  initSavedDrawer();
  initTriggers();
  initProductView();
  document.documentElement.classList.add("is-ready");
}

start();
