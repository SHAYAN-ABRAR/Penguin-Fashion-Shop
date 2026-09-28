/* Penguin Fashion — saved pieces (the wishlist): a light drawer listing what you've hearted. */

import { productById, styleById, fitById, imageSrc } from "./catalog.js";
import { saved } from "./store.js";
import { escapeHTML, formatPrice, icon, openModal, closeModal, setupModal } from "./ui.js";
import { provide, run } from "./actions.js";

const NOTICE_TEXT = {
  unreadable: () => "The saved list on this device couldn't be read, so it was cleared.",
  outdated: () => "The saved list on this device came from an older version of this shop, so it was cleared.",
  dropped: (n) => `${n === 1 ? "One saved piece is" : `${n} saved pieces are`} no longer in the collection, so ${n === 1 ? "it was" : "they were"} removed.`,
  invalid: (n) => `${n === 1 ? "One saved entry wasn't" : `${n} saved entries weren't`} readable, so ${n === 1 ? "it was" : "they were"} removed.`,
  unavailable: () => "This browser isn't letting the shop save your list, so it will clear when you leave.",
  unsaved: () => "Your saved list couldn't be stored on this device just now, so it will clear when you leave.",
};

let dialog, bodyEl, liveEl, headingCount;
let notices = [];
let undo = null;
let focusAfterRender = null;

function render() {
  const ids = saved.ids();
  headingCount.textContent = ids.length ? `(${ids.length})` : "";
  const noticeHTML = notices.map((n) => `<div class="notice notice-warn">${icon("info")}<p>${escapeHTML(NOTICE_TEXT[n.type](n.count))}</p></div>`).join("") +
    (undo ? `<div class="notice notice-undo">${icon("check")}<p>Removed ${escapeHTML(productById[undo.id].name)}.</p><button type="button" class="btn btn-quiet btn-small" data-saved-undo>${icon("undo", "icon-sm")}Undo</button></div>` : "");

  if (!ids.length) {
    bodyEl.innerHTML = noticeHTML + `
      <div class="empty-state">
        <svg class="empty-mark" aria-hidden="true" focusable="false"><use href="#penguin-mark"/></svg>
        <h3>Nothing saved yet</h3>
        <p>Select the heart on any piece to keep it here for later.</p>
        <button type="button" class="btn btn-primary" data-saved-browse>Browse the collection</button>
      </div>`;
  } else {
    bodyEl.innerHTML = noticeHTML + `<ul class="saved-list" role="list">${ids.map((id) => {
      const p = productById[id];
      return `<li class="saved-item" data-saved-item="${id}">
        <img src="${imageSrc(p, 200)}" width="200" height="250" alt="" loading="lazy" decoding="async">
        <div>
          <button type="button" class="line-name" data-open-product="${id}">${escapeHTML(p.name)}</button>
          <p class="line-meta">${escapeHTML(styleById[p.style].single)} · ${escapeHTML(fitById[p.fit].label)} · <span class="price">${formatPrice(p.price)}</span></p>
        </div>
        <div class="saved-actions">
          <button type="button" class="icon-button" data-open-product="${id}">${icon("arrowRight")}<span class="visually-hidden">View ${escapeHTML(p.name)}</span></button>
          <button type="button" class="icon-button" data-saved-remove="${id}">${icon("close")}<span class="visually-hidden">Remove ${escapeHTML(p.name)} from saved pieces</span></button>
        </div>
      </li>`;
    }).join("")}</ul>
    <p class="saved-note">${icon(saved.persistent ? "device" : "info")}<span>${saved.persistent ? "Saved on this device. Choose a size in the product view to add a piece to your bag." : "This browser isn't saving your list, so it will clear when you leave."}</span></p>`;
  }
  if (focusAfterRender) {
    const target = focusAfterRender();
    focusAfterRender = null;
    if (target) target.focus();
  }
}

export function openSaved(invoker = document.activeElement) {
  notices = notices.concat(saved.takeNotices());
  undo = null;
  render();
  openModal(dialog, { returnFocus: invoker, focus: dialog.querySelector("[data-autofocus]") });
}

export function initSavedDrawer() {
  dialog = document.querySelector("[data-saved-drawer]");
  bodyEl = dialog.querySelector("[data-saved-body]");
  liveEl = dialog.querySelector("[data-saved-live]");
  headingCount = dialog.querySelector("[data-saved-heading-count]");
  setupModal(dialog, { onClose() { notices = []; undo = null; } });

  dialog.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-saved-remove]");
    if (remove) {
      const id = remove.getAttribute("data-saved-remove");
      undo = saved.remove(id);
      focusAfterRender = () => dialog.querySelector("[data-saved-undo]");
      render();
      liveEl.textContent = `Removed ${productById[id].name} from saved pieces. Undo is available.`;
      return;
    }
    if (event.target.closest("[data-saved-undo]") && undo) {
      const restored = undo;
      undo = null;
      saved.restore(restored);
      focusAfterRender = () => dialog.querySelector(`[data-saved-remove="${restored.id}"]`);
      render();
      liveEl.textContent = `${productById[restored.id].name} is back in your saved pieces.`;
      return;
    }
    if (event.target.closest("[data-saved-browse]")) {
      closeModal(dialog);
      window.setTimeout(() => run("scrollToCollection"), 0);
    }
  });

  saved.subscribe((reason) => {
    if (!dialog.open) return;
    if (reason === "external") { undo = null; notices = notices.concat(saved.takeNotices()); }
    if (reason !== "remove" && reason !== "restore") render();
  });

  provide("openSaved", openSaved);
}
