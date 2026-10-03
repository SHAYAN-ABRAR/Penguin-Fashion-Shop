/* Category shortcuts stay in sync with the catalog. */
import { PRODUCTS, STYLES } from "./catalog.js";
import { escapeHTML, plural } from "./ui.js";

export function initHero() {
  const tiles = document.querySelector("[data-style-tiles]");
  if (!tiles) return;
  tiles.innerHTML = STYLES.map((style) => {
    const count = PRODUCTS.filter((p) => p.style === style.id).length;
    if (!count) return "";
    return `<li><button type="button" class="style-tile" data-apply-style="${style.id}">
      <span><span class="style-tile-name">${escapeHTML(style.label)}</span><span class="style-tile-count">${plural(count, "piece", "pieces")}</span></span>
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>
    </button></li>`;
  }).join("");
}
