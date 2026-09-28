/* Penguin Fashion — shared UI helpers: formatting, icons, modals, announcements and toasts. */

import { CURRENCY } from "./catalog.js";

const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
export const formatPrice = (amount) => priceFormat.format(amount);
export const pad2 = (n) => String(n).padStart(2, "0");
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Line icons on a 24px grid. */
const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  heart: '<path d="M12 19.5s-7.3-4.3-7.3-9.8A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.3 2.3c0 5.5-7.3 9.8-7.3 9.8z"/>',
  bag: '<path d="M5.5 8.5h13l-.9 11.5H6.4z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  menu: '<path d="M4 7.5h16M4 12h16M4 16.5h10"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  arrowRight: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
  arrowLeft: '<path d="M19 12H5M10.5 6.5 5 12l5.5 5.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  trash: '<path d="M5 7.5h14M10 7.5V5.5h4v2M7 7.5l.9 11.5h8.2L17 7.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3M8 11h6"/>',
  ruler: '<path d="M3.8 15.2 15.2 3.8l5 5L8.8 20.2z"/><path d="M7.2 11.8l2 2M10 9l2 2M12.8 6.2l2 2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8.2v.1"/>',
  device: '<rect x="7" y="3.5" width="10" height="17" rx="2"/><path d="M11 17.5h2"/>',
  sliders: '<path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9"/><circle cx="15" cy="7.5" r="2"/><circle cx="9" cy="16.5" r="2"/>',
  undo: '<path d="M9 6.5 4.5 11 9 15.5"/><path d="M5 11h9.5a5 5 0 0 1 0 10H12"/>',
};

export function icon(name, className = "") {
  return `<svg class="icon${className ? " " + className : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}

/* Modals -----------------------------------------------------------------------------------------
 * Every overlay is a native <dialog> opened with showModal(), which keeps focus inside it and makes
 * the page behind it inert. This adds scroll locking, a close on backdrop click, and focus that
 * returns to whatever opened the dialog. */
const openModals = [];

export function openModal(dialog, { returnFocus = document.activeElement, focus } = {}) {
  if (dialog.open) return;
  dialog._returnFocus = returnFocus instanceof HTMLElement ? returnFocus : null;
  if (!openModals.length) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--lock-gap", `${Math.max(0, gap)}px`);
  }
  dialog.showModal();
  openModals.push(dialog);
  document.documentElement.classList.add("has-modal");
  const target = focus || dialog.querySelector("[data-autofocus]");
  if (target) target.focus({ preventScroll: true });
}

export function closeModal(dialog) {
  if (dialog.open) dialog.close();
}

export function setupModal(dialog, { onClose, closeOnBackdrop = true } = {}) {
  dialog.addEventListener("close", () => {
    const index = openModals.indexOf(dialog);
    if (index !== -1) openModals.splice(index, 1);
    if (!openModals.length) document.documentElement.classList.remove("has-modal");
    if (onClose) onClose();
    const target = dialog._returnFocus;
    dialog._returnFocus = null;
    if (target && target.isConnected && !target.closest("[inert]")) target.focus({ preventScroll: true });
  });
  if (closeOnBackdrop) {
    // A click whose target is the dialog element itself landed on the backdrop, outside the panel.
    dialog.addEventListener("mousedown", (event) => { dialog._pressedBackdrop = event.target === dialog; });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog && dialog._pressedBackdrop) closeModal(dialog);
      dialog._pressedBackdrop = false;
    });
  }
  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeModal(dialog)));
}

export const anyModalOpen = () => openModals.length > 0;

/* Announcements for screen readers -------------------------------------------------------------- */
let liveRegion;
export function announce(message) {
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.className = "visually-hidden";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = "";
  window.setTimeout(() => { liveRegion.textContent = message; }, 40);
}

/* Toast -----------------------------------------------------------------------------------------
 * A small note at the bottom of the screen. It's announced politely, stays while hovered or
 * focused, and hides after a few seconds, so it never interrupts browsing. */
let toastRegion, toastTimer;
function ensureToastRegion() {
  if (toastRegion) return toastRegion;
  toastRegion = document.createElement("div");
  toastRegion.className = "toast-region";
  toastRegion.setAttribute("role", "status");
  toastRegion.setAttribute("aria-live", "polite");
  document.body.appendChild(toastRegion);
  const hold = () => window.clearTimeout(toastTimer);
  const release = () => scheduleHide(4000);
  toastRegion.addEventListener("mouseenter", hold);
  toastRegion.addEventListener("mouseleave", release);
  toastRegion.addEventListener("focusin", hold);
  toastRegion.addEventListener("focusout", release);
  return toastRegion;
}

function scheduleHide(delay) {
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, delay);
}

export function hideToast() {
  if (!toastRegion) return;
  const toast = toastRegion.querySelector(".toast");
  if (toast) toast.classList.add("is-leaving");
  window.setTimeout(() => { if (toastRegion) toastRegion.innerHTML = ""; }, reduceMotion() ? 0 : 160);
}

/* toast({ title, text, image, action: { label, onClick }, tone }) */
export function toast({ title, text = "", image = "", action = null, tone = "default" }) {
  const region = ensureToastRegion();
  region.innerHTML =
    `<div class="toast toast-${tone}">` +
      (image ? `<img class="toast-image" src="${escapeHTML(image)}" alt="" width="200" height="250">` : `<span class="toast-icon">${icon(tone === "warn" ? "info" : "check")}</span>`) +
      `<div class="toast-body"><p class="toast-title">${escapeHTML(title)}</p>${text ? `<p class="toast-text">${escapeHTML(text)}</p>` : ""}</div>` +
      (action ? `<button type="button" class="toast-action">${escapeHTML(action.label)}</button>` : "") +
      `<button type="button" class="toast-close icon-button">${icon("close", "icon-sm")}<span class="visually-hidden">Dismiss</span></button>` +
    `</div>`;
  if (action) region.querySelector(".toast-action").addEventListener("click", () => { hideToast(); action.onClick(); });
  region.querySelector(".toast-close").addEventListener("click", hideToast);
  scheduleHide(tone === "warn" ? 8000 : 5000);
}
