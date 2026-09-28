/* Penguin Fashion — the Winter Edit: a shoppable lookbook in a user-controlled carousel.
 * Slides sit in a horizontal scroll-snap strip, so touch swiping works natively; the tabs, the
 * previous/next buttons and the arrow keys move it too. It never moves on its own, and slides that
 * aren't showing are inert so keyboard and screen-reader users only meet the current one. */

import { EDITS, productById, imageSrc, imageSrcset } from "./catalog.js";
import { escapeHTML, formatPrice, icon, pad2, announce, reduceMotion } from "./ui.js";

function slideHTML(edit, index, total) {
  const products = edit.products.map((id) => productById[id]);
  const pieces = products.map((p, i) => `
    <figure class="piece-${i + 1}">
      <img src="${imageSrc(p, 400)}" srcset="${imageSrc(p, 400)} 400w, ${imageSrc(p, 720)} 720w"
           sizes="${i === 0 ? "(min-width: 900px) 28vw, 48vw" : "(min-width: 900px) 18vw, 30vw"}"
           width="400" height="500" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async">
    </figure>`).join("");
  const list = products.map((p) => `
    <li><a class="edit-product" href="?product=${encodeURIComponent(p.id)}" data-open-product="${p.id}">
      <img src="${imageSrc(p, 200)}" width="200" height="250" alt="" loading="lazy" decoding="async">
      <span><span class="edit-product-name">${escapeHTML(p.name)}</span><br><span class="edit-product-price">${formatPrice(p.price)}</span></span>
      ${icon("arrowRight", "icon-sm")}
    </a></li>`).join("");
  return `
    <div class="edit-slide" data-tone="${edit.tone}" role="group" aria-roledescription="slide"
             aria-label="${index + 1} of ${total}: ${escapeHTML(edit.title)}" data-edit="${edit.id}">
      <div class="edit-art">
        <p class="edit-art-label" aria-hidden="true">Edit ${pad2(index + 1)}</p>
        ${pieces}
      </div>
      <div class="edit-copy">
        <p class="edit-number">Edit ${pad2(index + 1)} of ${pad2(total)}</p>
        <h3 class="edit-title">${escapeHTML(edit.title)}</h3>
        <p class="edit-idea">${escapeHTML(edit.idea)}</p>
        <p class="edit-styling">${escapeHTML(edit.styling)}</p>
        <ul class="edit-products" role="list" aria-label="In this edit">${list}</ul>
        <div class="edit-actions">
          <button type="button" class="btn btn-primary" data-shop-edit="${edit.id}">Shop this edit${icon("arrowRight")}</button>
        </div>
      </div>
    </div>`;
}

export function initLookbook() {
  const root = document.querySelector("[data-lookbook]");
  if (!root) return;
  const track = root.querySelector("[data-lookbook-track]");
  const tabsBox = root.querySelector("[data-lookbook-tabs]");
  const prev = root.querySelector("[data-lookbook-prev]");
  const next = root.querySelector("[data-lookbook-next]");
  const position = root.querySelector("[data-lookbook-position]");
  const total = EDITS.length;

  track.removeAttribute("aria-live");
  track.innerHTML = EDITS.map((edit, i) => slideHTML(edit, i, total)).join("");
  tabsBox.innerHTML = EDITS.map((edit, i) =>
    `<button type="button" class="lookbook-tab" data-lookbook-to="${i}" aria-controls="lookbook-track"><span class="num">${pad2(i + 1)}</span>${escapeHTML(edit.short)}<span class="visually-hidden"> edit</span></button>`).join("");
  track.id = "lookbook-track";
  const slides = [...track.children];
  const tabs = [...tabsBox.children];
  let current = 0;
  let settleTimer = null;

  function show(index) {
    current = index;
    slides.forEach((slide, i) => {
      const on = i === index;
      slide.toggleAttribute("inert", !on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
    tabs.forEach((tab, i) => tab.setAttribute("aria-current", i === index ? "true" : "false"));
    position.textContent = `${index + 1} / ${total}`;
  }

  function goTo(index, { instant = false, speak = true } = {}) {
    const target = ((index % total) + total) % total;
    show(target);
    track.scrollTo({ left: slides[target].offsetLeft, behavior: instant || reduceMotion() ? "auto" : "smooth" });
    if (speak) announce(`Edit ${target + 1} of ${total}: ${EDITS[target].title}`);
  }

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  tabs.forEach((tab, i) => tab.addEventListener("click", () => goTo(i)));

  // Arrow keys, Home and End while focus is on the tabs or the arrows.
  root.addEventListener("keydown", (event) => {
    if (!event.target.closest("[data-lookbook-controls]")) return;
    const moves = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: total - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = ((moves[event.key] % total) + total) % total;
    goTo(target);
    if (event.target.hasAttribute("data-lookbook-to")) tabs[target].focus();
  });

  // After a swipe or trackpad scroll settles, work out which edit is showing.
  track.addEventListener("scroll", () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const index = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (index !== current) { show(index); announce(`Edit ${index + 1} of ${total}: ${EDITS[index].title}`); }
    }, 100);
  }, { passive: true });

  // Keep the same edit in view when the window is resized or a phone is rotated.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => goTo(current, { instant: true, speak: false }), 120);
  });

  // Load every edit's images together once the section is near, so slides never change size or flash.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        track.querySelectorAll("img[loading='lazy']").forEach((img) => { img.loading = "eager"; });
        observer.disconnect();
      }
    }, { rootMargin: "600px 0px" });
    observer.observe(root);
  }

  show(0);
}
