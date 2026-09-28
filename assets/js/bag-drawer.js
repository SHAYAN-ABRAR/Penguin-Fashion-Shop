/* Penguin Fashion — the bag: a drawer on wide screens and a bottom sheet on phones.
 * Quantities, removal with undo, line totals and a subtotal. Prices always come from the catalog.
 * There's deliberately no checkout: this is a demo shop. */

import { productById, styleById, imageSrc, MAX_QUANTITY } from "./catalog.js";
import { bag } from "./store.js";
import { escapeHTML, formatPrice, icon, plural, openModal, closeModal, setupModal } from "./ui.js";
import { provide, run } from "./actions.js";

const NOTICE_TEXT = {
  unreadable: () => "The bag saved on this device couldn't be read, so it was emptied.",
  outdated: () => "The bag saved on this device came from an older version of this shop, so it was emptied.",
  dropped: (n) => `${n === 1 ? "One piece is" : `${n} pieces are`} no longer in the collection, so ${n === 1 ? "it was" : "they were"} removed.`,
  invalid: (n) => `${n === 1 ? "One saved line was" : `${n} saved lines were`} incomplete or had an unavailable size, so ${n === 1 ? "it was" : "they were"} removed.`,
  lowered: (n) => `${n === 1 ? "One quantity was" : `${n} quantities were`} above ${MAX_QUANTITY}, the most one bag can hold, so ${n === 1 ? "it was" : "they were"} lowered.`,
  unavailable: () => "This browser isn't letting the shop save your bag, so it will clear when you leave. Private windows and blocked site data can cause this.",
  unsaved: () => "Your bag couldn't be saved on this device just now, so it will clear when you leave.",
};

let dialog, bodyEl, footerEl, liveEl, headingCount;
let notices = [];
let undo = null;       // { removed, name } for the last removed line
let focusAfterRender = null;

function lineHTML(item) {
  const product = productById[item.id];
  const label = `${product.name}, size ${item.size}`;
  return `<li class="line" data-line="${item.id}|${item.size}">
    <button type="button" class="line-thumb" data-open-product="${product.id}" tabindex="-1" aria-hidden="true">
      <img src="${imageSrc(product, 200)}" width="200" height="250" alt="" loading="lazy" decoding="async">
    </button>
    <div class="line-info">
      <div class="line-top">
        <button type="button" class="line-name" data-open-product="${product.id}">${escapeHTML(product.name)}</button>
        <span class="line-total price"><span class="visually-hidden">Line total </span>${formatPrice(product.price * item.qty)}</span>
      </div>
      <p class="line-meta">Size ${escapeHTML(item.size)} · ${escapeHTML(product.color.name)}</p>
      <p class="line-meta">${formatPrice(product.price)} each</p>
    </div>
    <div class="line-controls">
      <div class="stepper" role="group" aria-label="Quantity of ${escapeHTML(label)}">
        <button type="button" data-qty="dec" aria-label="One fewer"${item.qty <= 1 ? ' aria-disabled="true"' : ""}>${icon("minus")}</button>
        <output aria-label="Quantity">${item.qty}</output>
        <button type="button" data-qty="inc" aria-label="One more"${item.qty >= MAX_QUANTITY ? ' aria-disabled="true"' : ""}>${icon("plus")}</button>
      </div>
      <button type="button" class="line-remove" data-remove>${icon("trash", "icon-sm")}<span class="remove-word">Remove<span class="visually-hidden"> ${escapeHTML(label)}</span></span></button>
    </div>
  </li>`;
}

function noticesHTML() {
  const list = notices.map((n) => `<div class="notice notice-warn">${icon("info")}<p>${escapeHTML(NOTICE_TEXT[n.type](n.count))}</p></div>`);
  if (undo) {
    list.push(`<div class="notice notice-undo">${icon("check")}<p>Removed ${escapeHTML(undo.name)}.</p>` +
      `<button type="button" class="btn btn-quiet btn-small" data-undo>${icon("undo", "icon-sm")}Undo</button></div>`);
  }
  return list.join("");
}

function render() {
  const items = bag.items();
  const count = bag.count();
  headingCount.textContent = count ? `(${count})` : "";

  if (!items.length) {
    bodyEl.innerHTML = noticesHTML() + `
      <div class="empty-state">
        <svg class="empty-mark" aria-hidden="true" focusable="false"><use href="#penguin-mark"/></svg>
        <h3>Your bag is empty</h3>
        <p>Pieces you add stay here, saved on this device, until you remove them.</p>
        <button type="button" class="btn btn-primary" data-continue="collection">Continue shopping</button>
      </div>`;
    footerEl.innerHTML = "";
  } else {
    bodyEl.innerHTML = noticesHTML() + `<ul class="line-list" role="list">${items.map(lineHTML).join("")}</ul>`;
    const saving = bag.persistent
      ? `<p>${icon("device")}<span>Saved on this device. Your bag stays here when you come back.</span></p>`
      : `<p>${icon("info")}<span>This browser isn't saving your bag, so it will clear when you leave.</span></p>`;
    footerEl.innerHTML = `
      <dl class="summary">
        <div class="summary-row"><dt>Pieces</dt><dd>${count}</dd></div>
        <div class="summary-row summary-total"><dt>Subtotal</dt><dd class="price">${formatPrice(bag.subtotal())}</dd></div>
      </dl>
      <div class="bag-note">
        ${saving}
        <p>${icon("info")}<span>Demo shop: prices are sample values, and there's no checkout, so nothing is ordered or charged.</span></p>
      </div>
      <button type="button" class="btn btn-primary btn-block" data-continue="close">Continue shopping</button>`;
  }

  if (focusAfterRender) {
    const target = focusAfterRender();
    focusAfterRender = null;
    if (target) target.focus({ preventScroll: false });
  }
}

function lineFrom(element) {
  const line = element.closest("[data-line]");
  if (!line) return null;
  const [id, size] = line.getAttribute("data-line").split("|");
  return { id, size, line };
}

export function openBag(invoker = document.activeElement) {
  notices = notices.concat(bag.takeNotices());
  undo = null;
  render();
  openModal(dialog, { returnFocus: invoker, focus: dialog.querySelector("[data-autofocus]") });
  bodyEl.scrollTop = 0;
}

export function initBagDrawer() {
  dialog = document.querySelector("[data-bag-drawer]");
  bodyEl = dialog.querySelector("[data-bag-body]");
  footerEl = dialog.querySelector("[data-bag-footer]");
  liveEl = dialog.querySelector("[data-bag-live]");
  headingCount = dialog.querySelector("[data-bag-heading-count]");
  setupModal(dialog, { onClose() { notices = []; undo = null; } });

  dialog.addEventListener("click", (event) => {
    const qty = event.target.closest("[data-qty]");
    if (qty) {
      const ref = lineFrom(qty);
      if (!ref || qty.getAttribute("aria-disabled") === "true") return;
      const current = bag.quantityOf(ref.id, ref.size);
      const next = bag.setQuantity(ref.id, ref.size, current + (qty.getAttribute("data-qty") === "inc" ? 1 : -1));
      const which = qty.getAttribute("data-qty");
      focusAfterRender = () => dialog.querySelector(`[data-line="${ref.id}|${ref.size}"] [data-qty="${which}"]`);
      render();
      liveEl.textContent = `${productById[ref.id].name}, size ${ref.size}: quantity ${next}.${next === MAX_QUANTITY ? ` That's the most one bag can hold.` : ""}`;
      return;
    }
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      const ref = lineFrom(remove);
      const removed = bag.remove(ref.id, ref.size);
      undo = { removed, name: `${productById[ref.id].name}, size ${ref.size}` };
      focusAfterRender = () => dialog.querySelector("[data-undo]");
      render();
      liveEl.textContent = `Removed ${undo.name}. Undo is available.`;
      return;
    }
    if (event.target.closest("[data-undo]") && undo) {
      const { removed, name } = undo;
      undo = null;
      bag.restore(removed);
      focusAfterRender = () => dialog.querySelector(`[data-line="${removed.id}|${removed.size}"] [data-remove]`) || dialog.querySelector("[data-autofocus]");
      render();
      liveEl.textContent = `${name} is back in your bag.`;
      return;
    }
    const cont = event.target.closest("[data-continue]");
    if (cont) {
      const toCollection = cont.getAttribute("data-continue") === "collection";
      closeModal(dialog);
      if (toCollection) window.setTimeout(() => run("scrollToCollection"), 0);
    }
  });

  // Keep the drawer in step with changes from the product view or another tab.
  bag.subscribe((reason) => {
    if (!dialog.open) return;
    if (reason === "external") {
      undo = null;
      notices = notices.concat(bag.takeNotices());
      render();
    } else if (reason === "add") {
      render();
    }
  });

  provide("openBag", openBag);
}
