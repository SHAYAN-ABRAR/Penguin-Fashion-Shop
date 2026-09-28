/* Penguin Fashion — hero details and the "Shop by style" strip, filled in from the catalog so the
 * names, prices and counts always match it. */

import { PRODUCTS, STYLES, SIZES, productById, imageSrc } from "./catalog.js";
import { escapeHTML, formatPrice, icon, pad2, plural } from "./ui.js";

export function initHero() {
  document.querySelectorAll("[data-hero-image]").forEach((img) => {
    const product = productById[img.getAttribute("data-hero-image")];
    if (product) img.alt = product.alt;
  });

  document.querySelectorAll("[data-hero-caption]").forEach((caption) => {
    const product = productById[caption.getAttribute("data-hero-caption")];
    if (!product) return;
    caption.innerHTML = `<a class="art-caption-button" href="?product=${encodeURIComponent(product.id)}" data-open-product="${product.id}">
      <span class="num">No. ${pad2(product.number)}</span>
      <span class="name">${escapeHTML(product.name)}</span>
      <span class="price">${formatPrice(product.price)}</span>
    </a>`;
  });

  const facts = document.querySelector("[data-hero-facts]");
  if (facts) {
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    const sizes = [...new Set(Object.values(SIZES).flat())].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    facts.innerHTML = `
      <div><dt>Pieces</dt><dd>${PRODUCTS.length}</dd></div>
      <div><dt>Styles</dt><dd>${STYLES.length}</dd></div>
      <div><dt>Sizes</dt><dd>${sizes[0]}–${sizes[sizes.length - 1]}</dd></div>`;
  }

  const tiles = document.querySelector("[data-style-tiles]");
  if (tiles) {
    tiles.innerHTML = STYLES.map((style) => {
      const members = PRODUCTS.filter((p) => p.style === style.id);
      if (!members.length) return "";
      const lead = members[0];
      return `<li><button type="button" class="style-tile" data-apply-style="${style.id}">
        <img src="${imageSrc(lead, 200)}" width="200" height="250" alt="" loading="lazy" decoding="async">
        <span><span class="style-tile-name">${escapeHTML(style.label)}</span><span class="style-tile-count">${plural(members.length, "piece", "pieces")}</span></span>
        ${icon("arrowRight")}
      </button></li>`;
    }).join("");
  }
}
