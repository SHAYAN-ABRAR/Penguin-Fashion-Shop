/* Penguin Fashion — the product view: a dialog with a large zoomable image, size selection,
 * add to bag, the size guide and related pieces.
 *
 * Opening a product adds ?product=<id> to the address with pushState, so the back button closes it,
 * a link to it can be shared, and the collection's filters and scroll position are left as they were. */

import { PRODUCTS, productById, styleById, fitById, sizesFor, imageSrc, imageSrcset, MAX_QUANTITY } from "./catalog.js";
import { bag, saved } from "./store.js";
import { escapeHTML, formatPrice, icon, pad2, plural, openModal, closeModal, setupModal, announce } from "./ui.js";
import { provide, run } from "./actions.js";

const selections = new Map(); // product id -> chosen size, remembered for this visit
let dialog, view;
let currentId = null;
let zoom = null;
let unwinding = false;        // true while history.go() takes us back past the product entries
let skipHistoryCleanup = false;
let afterClose = null;
let successTimer = null;

/* Address helpers ------------------------------------------------------------------------------ */
function urlFor(id) {
  const params = new URLSearchParams(window.location.search);
  if (id) params.set("product", id);
  else params.delete("product");
  const query = params.toString();
  return window.location.pathname + (query ? "?" + query : "");
}

function relatedFor(product) {
  const score = (p) => (p.style === product.style ? 4 : 0) + (p.fit === product.fit ? 2 : 0) + (p.hooded === product.hooded ? 1 : 0);
  return PRODUCTS.filter((p) => p.id !== product.id).sort((a, b) => score(b) - score(a) || a.number - b.number).slice(0, 3);
}

/* Markup --------------------------------------------------------------------------------------- */
function viewHTML(product) {
  const style = styleById[product.style];
  const fit = fitById[product.fit];
  const chosen = selections.get(product.id) || "";
  const sizes = sizesFor(product).map((size) =>
    `<label class="size-option"><input type="radio" name="size" value="${size}"${size === chosen ? " checked" : ""}><span>${size}</span></label>`).join("");
  const related = relatedFor(product).map((p) => `
    <li><a class="related-card" href="?product=${encodeURIComponent(p.id)}" data-open-product="${p.id}">
      <img src="${imageSrc(p, 400)}" srcset="${imageSrcset(p)}" sizes="(min-width: 900px) 300px, 30vw" width="400" height="500" alt="" loading="lazy" decoding="async">
      <span class="related-name">${escapeHTML(p.name)}</span>
      <span class="related-price price">${formatPrice(p.price)}</span>
    </a></li>`).join("");

  return `
    <header class="pd-topbar">
      <nav aria-label="Breadcrumb"><ol class="pd-crumbs">
        <li><button type="button" data-crumb="collection">Collection</button></li>
        <li><button type="button" data-crumb="style">${escapeHTML(style.label)}</button></li>
        <li aria-current="page" class="visually-hidden">${escapeHTML(product.name)}</li>
      </ol></nav>
      <button type="button" class="icon-button" data-close-product>${icon("close")}<span class="visually-hidden">Close ${escapeHTML(product.name)}</span></button>
    </header>
    <div class="pd-scroll" data-pd-scroll>
      <div class="pd-main">
        <div class="pd-media">
          <span class="pd-number" aria-hidden="true">No. ${pad2(product.number)}</span>
          <div class="zoom-frame" data-zoom-frame role="img" aria-label="${escapeHTML(product.alt)}" tabindex="-1">
            <img src="${imageSrc(product, 720)}" srcset="${imageSrc(product, 400)} 400w, ${imageSrc(product, 720)} 720w"
                 sizes="(min-width: 900px) 560px, 100vw" width="720" height="900" alt="" decoding="async" draggable="false">
          </div>
          <div class="zoom-bar">
            <p class="zoom-hint" data-zoom-hint>Select the photo or Zoom in for a closer look.</p>
            <button type="button" class="btn btn-quiet btn-small" data-zoom-toggle aria-pressed="false">
              <span data-zoom-icon>${icon("zoomIn")}</span><span data-zoom-label>Zoom in</span>
            </button>
          </div>
        </div>

        <div class="pd-info">
          <div class="pd-heading">
            <p class="pd-meta">${escapeHTML(style.single)} · ${escapeHTML(fit.label)}</p>
            <h2 class="pd-title" id="product-title" tabindex="-1">${escapeHTML(product.name)}</h2>
            <p class="pd-price price">${formatPrice(product.price)}</p>
          </div>
          <p class="pd-color"><span class="swatch" style="background:${product.color.swatch}"></span>Color: ${escapeHTML(product.color.name)}</p>
          <p class="pd-description">${escapeHTML(product.description)}</p>

          <form class="pd-form" data-add-form novalidate>
            <div class="size-field" data-size-field>
              <div class="size-field-head">
                <p class="size-label" id="size-label">Size <span class="required">(required)</span></p>
                <button type="button" class="link-button size-guide-link" data-pd-size-guide>${icon("ruler", "icon-sm")}Size guide</button>
              </div>
              <div class="size-options" role="radiogroup" aria-labelledby="size-label" aria-required="true" data-size-options>${sizes}</div>
              <p class="field-error" id="size-error" data-size-error hidden>${icon("info")}<span>Choose a size to add this piece to your bag.</span></p>
            </div>
            <div class="pd-actions">
              <button type="submit" class="btn btn-primary btn-large add-button" data-add-button>
                <span data-add-icon>${icon("bag")}</span><span data-add-label>Add to bag</span>
              </button>
              <button type="button" class="save-toggle" data-save-toggle="${product.id}" aria-pressed="${saved.has(product.id)}">
                ${icon("heart")}<span class="visually-hidden">Save ${escapeHTML(product.name)}</span>
              </button>
            </div>
            <div class="pd-feedback" role="status" aria-live="polite" data-add-feedback></div>
          </form>

          <div class="pd-notes">
            <p>${icon("device")}<span>Your bag is saved on this device.</span></p>
            <p>${icon("info")}<span>Sample price. This demo shop has no checkout.</span></p>
          </div>

          <div class="pd-details">
            <h3>In the photo</h3>
            <ul role="list">${product.features.map((f) => `<li>${escapeHTML(f)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>

      <section class="pd-related" aria-labelledby="related-title">
        <h3 id="related-title">You might also like</h3>
        <ul class="related-grid" role="list">${related}</ul>
      </section>
    </div>`;
}

/* Zoom: select the photo (or the Zoom button) to magnify it, then move a pointer or finger across
 * it; arrow keys move the view too, and Escape zooms back out. */
function setupZoom(root) {
  const frame = root.querySelector("[data-zoom-frame]");
  const toggle = root.querySelector("[data-zoom-toggle]");
  const hint = root.querySelector("[data-zoom-hint]");
  let zoomed = false;
  let origin = { x: 50, y: 50 };
  let press = null;

  const clamp = (n) => Math.max(0, Math.min(100, n));
  function setOrigin(x, y) {
    origin = { x: clamp(x), y: clamp(y) };
    frame.style.setProperty("--zoom-x", origin.x + "%");
    frame.style.setProperty("--zoom-y", origin.y + "%");
  }
  function pointFrom(event) {
    const rect = frame.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  }
  function set(on, point) {
    zoomed = on;
    frame.classList.toggle("is-zoomed", on);
    toggle.setAttribute("aria-pressed", String(on));
    toggle.querySelector("[data-zoom-label]").textContent = on ? "Zoom out" : "Zoom in";
    toggle.querySelector("[data-zoom-icon]").innerHTML = icon(on ? "zoomOut" : "zoomIn");
    hint.textContent = on ? "Move across the photo to look around. Arrow keys work too." : "Select the photo or Zoom in for a closer look.";
    if (on && point) setOrigin(point.x, point.y);
    if (!on) setOrigin(50, 50);
  }

  frame.addEventListener("pointerdown", (event) => {
    press = { x: event.clientX, y: event.clientY, moved: false, type: event.pointerType };
    if (zoomed && event.pointerType !== "mouse") frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener("pointermove", (event) => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) press.moved = true;
    if (!zoomed) return;
    if (event.pointerType === "mouse" || press) { const p = pointFrom(event); setOrigin(p.x, p.y); }
  });
  frame.addEventListener("pointerup", () => { window.setTimeout(() => { press = null; }, 0); });
  frame.addEventListener("pointercancel", () => { press = null; });
  frame.addEventListener("click", (event) => {
    if (press && press.moved) return;
    set(!zoomed, zoomed ? null : pointFrom(event));
  });
  toggle.addEventListener("click", () => set(!zoomed, null));
  toggle.addEventListener("keydown", (event) => {
    if (!zoomed) return;
    const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
    if (!step) return;
    event.preventDefault();
    setOrigin(origin.x + step[0], origin.y + step[1]);
  });

  return {
    isZoomed: () => zoomed,
    reset: () => set(false),
    focusToggle: () => toggle.focus({ preventScroll: true }),
  };
}

/* Behaviour ------------------------------------------------------------------------------------ */
function showSizeError(form) {
  const field = form.querySelector("[data-size-field]");
  const error = form.querySelector("[data-size-error]");
  field.classList.add("is-invalid");
  error.hidden = false;
  form.querySelector("[data-size-options]").setAttribute("aria-describedby", "size-error");
  form.querySelectorAll('input[name="size"]').forEach((radio) => {
    radio.setAttribute("aria-invalid", "true");
    radio.setAttribute("aria-describedby", "size-error");
  });
  const first = form.querySelector('input[name="size"]');
  first.focus({ preventScroll: true });
  field.scrollIntoView({ block: "center", behavior: "smooth" });
  announce("Choose a size to add this piece to your bag.");
}

function clearSizeError(form) {
  form.querySelector("[data-size-field]").classList.remove("is-invalid");
  form.querySelector("[data-size-error]").hidden = true;
  form.querySelector("[data-size-options]").removeAttribute("aria-describedby");
  form.querySelectorAll('input[name="size"]').forEach((radio) => {
    radio.removeAttribute("aria-invalid");
    radio.removeAttribute("aria-describedby");
  });
}

function showAdded(form, product, size, result) {
  const button = form.querySelector("[data-add-button]");
  const feedback = form.querySelector("[data-add-feedback]");
  const unsaved = bag.persistent ? "" : " This browser isn't saving your bag, so it will clear when you leave.";
  if (result.added > 0) {
    window.clearTimeout(successTimer);
    button.classList.add("is-success");
    button.querySelector("[data-add-label]").textContent = "Added to bag";
    button.querySelector("[data-add-icon]").innerHTML = icon("check");
    successTimer = window.setTimeout(() => {
      button.classList.remove("is-success");
      button.querySelector("[data-add-label]").textContent = "Add to bag";
      button.querySelector("[data-add-icon]").innerHTML = icon("bag");
    }, 1800);
    feedback.innerHTML = `${icon("check")}<span>Added in size ${size}. You have ${result.qty} in your bag.${unsaved}</span>` +
      `<button type="button" class="link-button" data-open-bag>View bag</button>`;
  } else {
    feedback.innerHTML = `${icon("info")}<span>You already have ${MAX_QUANTITY} in size ${size}, the most one bag can hold.</span>` +
      `<button type="button" class="link-button" data-open-bag>View bag</button>`;
  }
}

function render(id) {
  const product = productById[id];
  currentId = id;
  if (zoom) zoom.reset();
  view.innerHTML = viewHTML(product);
  zoom = setupZoom(view);
  const form = view.querySelector("[data-add-form]");

  form.addEventListener("change", (event) => {
    if (event.target.name !== "size") return;
    selections.set(product.id, event.target.value);
    clearSizeError(form);
    form.querySelector("[data-add-feedback]").innerHTML = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const size = (form.querySelector('input[name="size"]:checked') || {}).value;
    if (!size) { showSizeError(form); return; }
    const result = bag.add(product.id, size, 1);
    showAdded(form, product, size, result);
  });
  view.querySelector("[data-pd-size-guide]").addEventListener("click", (event) => {
    run("openSizeGuide", { fit: product.fit, size: selections.get(product.id) || "", invoker: event.currentTarget });
  });
  view.querySelector("[data-close-product]").addEventListener("click", () => closeModal(dialog));
  view.querySelectorAll("[data-crumb]").forEach((crumb) => crumb.addEventListener("click", () => {
    const target = crumb.getAttribute("data-crumb");
    afterClose = target === "style" ? () => run("applyStyle", product.style) : () => run("scrollToCollection");
    closeModal(dialog);
  }));
}

function show(id, invoker) {
  render(id);
  const title = view.querySelector("#product-title");
  if (!dialog.open) {
    openModal(dialog, { returnFocus: invoker, focus: title });
  } else {
    view.querySelector("[data-pd-scroll]").scrollTop = 0;
    title.focus({ preventScroll: true });
  }
  document.title = `${productById[id].name} · Penguin Fashion`;
}

function cardLinkFor(id) {
  return document.querySelector(`.product-card [data-open-product="${id}"]`) || document.getElementById("collection-title");
}

export function openProduct(id, invoker) {
  if (!productById[id]) return;
  const state = window.history.state;
  const depth = state && state.pf === "product" ? state.depth + 1 : 1;
  window.history.pushState({ pf: "product", id, depth }, "", urlFor(id));
  show(id, dialog.open ? null : invoker || cardLinkFor(id));
}

function finishClose() {
  document.title = "Penguin Fashion · Winter outerwear, edited";
  const next = afterClose;
  afterClose = null;
  if (next) window.setTimeout(next, 0);
}

export function initProductView() {
  dialog = document.querySelector("[data-product-dialog]");
  view = dialog.querySelector("[data-product-view]");

  setupModal(dialog, {
    onClose() {
      if (zoom) zoom.reset();
      currentId = null;
      if (skipHistoryCleanup) { skipHistoryCleanup = false; finishClose(); return; }
      const state = window.history.state;
      if (state && state.pf === "product" && state.depth > 0) {
        unwinding = true;
        window.history.go(-state.depth); // popstate finishes the close
      } else {
        if (state && state.pf === "product") window.history.replaceState(null, "", urlFor(null));
        finishClose();
      }
    },
  });

  // Escape zooms out first, and closes the product on the next press.
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && zoom && zoom.isZoomed()) {
      event.preventDefault();
      event.stopPropagation();
      zoom.reset();
      zoom.focusToggle();
    }
  }, true);
  dialog.addEventListener("cancel", (event) => {
    if (zoom && zoom.isZoomed()) { event.preventDefault(); zoom.reset(); }
  });

  window.addEventListener("popstate", (event) => {
    const state = event.state;
    if (unwinding) {
      unwinding = false;
      if (state && state.pf === "product") window.history.replaceState(null, "", urlFor(null));
      finishClose();
      return;
    }
    if (state && state.pf === "product" && productById[state.id]) {
      show(state.id, dialog.open ? null : cardLinkFor(state.id));
    } else if (dialog.open) {
      skipHistoryCleanup = true;
      closeModal(dialog);
    }
  });

  provide("openProduct", openProduct);
  provide("currentProduct", () => currentId);

  // A shared link such as ?product=midnight-quilted-puffer opens that piece.
  const initial = new URLSearchParams(window.location.search).get("product");
  if (initial) {
    if (productById[initial]) {
      window.history.replaceState({ pf: "product", id: initial, depth: 0 }, "", urlFor(initial));
      show(initial, cardLinkFor(initial));
    } else {
      window.history.replaceState(null, "", urlFor(null));
    }
  }
}
