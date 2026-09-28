/* Penguin Fashion — the size guide: sample body measurements with how-to-measure steps. */

import { SIZE_CHART, FITS, fitById } from "./catalog.js";
import { escapeHTML, icon, openModal, setupModal } from "./ui.js";
import { provide } from "./actions.js";

let dialog, body;
let current = { fit: "women", unit: "cm", size: "" };
let chosen = { fit: "", size: "" }; // the product and size the guide was opened for

const toInches = (cm) => Math.round((cm / 2.54) * 2) / 2;
function format(value) {
  const show = (n) => (current.unit === "cm" ? String(n) : String(toInches(n)).replace(/\.0$/, ""));
  return Array.isArray(value) ? `${show(value[0])}–${show(value[1])}` : show(value);
}

const DIAGRAM = `
<svg viewBox="0 0 170 210" role="img" aria-labelledby="diagram-title">
  <title id="diagram-title">Where to measure: chest (1), waist (2) and sleeve (3)</title>
  <path d="M66 22c6 7 32 7 38 0l28 12c7 3 10 9 11 16l12 104-15 3-10-86-2 116H42l-2-116-10 86-15-3 12-104c1-7 4-13 11-16z"
        fill="#ece5d8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M66 22c5 12 33 12 38 0" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <g stroke="#a5723f" stroke-width="1.6" stroke-linecap="round" fill="none">
    <path d="M44 74h82" stroke-dasharray="4 4"/><path d="M44 69v10M126 69v10"/>
    <path d="M46 120h78" stroke-dasharray="4 4"/><path d="M46 115v10M124 115v10"/>
    <path d="M134 38l17 112" stroke-dasharray="4 4"/><path d="M129 40l10-4M146 151l10-2"/>
  </g>
  <g font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#83572a" text-anchor="middle">
    <circle cx="85" cy="74" r="9" fill="#fbf8f2" stroke="#a5723f"/><text x="85" y="78">1</text>
    <circle cx="85" cy="120" r="9" fill="#fbf8f2" stroke="#a5723f"/><text x="85" y="124">2</text>
    <circle cx="143" cy="95" r="9" fill="#fbf8f2" stroke="#a5723f"/><text x="143" y="99">3</text>
  </g>
</svg>`;

function segmented(name, legend, options, value) {
  return `<fieldset class="segmented"><legend class="visually-hidden">${legend}</legend>${options.map((o) =>
    `<label><input type="radio" name="${name}" value="${o.value}"${o.value === value ? " checked" : ""}><span>${escapeHTML(o.label)}</span></label>`).join("")}</fieldset>`;
}

function render() {
  const highlight = chosen.fit === current.fit ? chosen.size : "";
  const rows = SIZE_CHART[current.fit].map((row) => `
    <tr${row.size === highlight ? ' class="is-current"' : ""}>
      <th scope="row">${row.size}${row.size === highlight ? '<span class="visually-hidden"> (your selected size)</span>' : ""}</th>
      <td>${format(row.chest)}</td><td>${format(row.waist)}</td><td>${format(row.sleeve)}</td>
    </tr>`).join("");
  const unitName = current.unit === "cm" ? "centimeters" : "inches";
  body.innerHTML = `
    <div class="sg-controls">
      ${segmented("sg-fit", "Fit", FITS.map((f) => ({ value: f.id, label: f.label })), current.fit)}
      ${segmented("sg-unit", "Units", [{ value: "cm", label: "cm" }, { value: "in", label: "inches" }], current.unit)}
    </div>
    <p class="sample-note">${icon("info")}<span><strong>Sample measurements.</strong> These are typical body measurements for this demo shop, not measurements taken from these garments.</span></p>
    <table class="size-table">
      <caption>${escapeHTML(fitById[current.fit].label)} body measurements, in ${unitName}</caption>
      <thead><tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Waist</th><th scope="col">Sleeve</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="measure" aria-labelledby="measure-title">
      ${DIAGRAM}
      <div>
        <h3 id="measure-title">How to measure</h3>
        <ol>
          <li><span><strong>Chest.</strong> Wear a thin top. Measure around the fullest part of your chest, just under your arms, keeping the tape level.</span></li>
          <li><span><strong>Waist.</strong> Measure around your natural waist, the narrowest part of your torso, with the tape snug but not tight.</span></li>
          <li><span><strong>Sleeve.</strong> Let your arm hang relaxed. Measure from the top of your shoulder to your wrist bone.</span></li>
        </ol>
        <p class="tip">Between two sizes, or planning to wear chunky knitwear underneath? Choose the larger size. It's easiest with a soft tape measure and someone to help.</p>
      </div>
    </section>`;
}

export function openSizeGuide({ fit = "", size = "", invoker = document.activeElement } = {}) {
  current = { fit: fitById[fit] ? fit : current.fit, unit: current.unit };
  chosen = { fit: fitById[fit] ? fit : "", size: fitById[fit] ? size : "" };
  render();
  openModal(dialog, { returnFocus: invoker, focus: dialog.querySelector("[data-autofocus]") });
  dialog.querySelector(".sg-body").scrollTop = 0;
}

export function initSizeGuide() {
  dialog = document.querySelector("[data-size-guide]");
  body = dialog.querySelector("[data-size-guide-body]");
  setupModal(dialog);
  body.addEventListener("change", (event) => {
    const input = event.target;
    if (input.name === "sg-fit") current.fit = input.value;
    else if (input.name === "sg-unit") current.unit = input.value;
    else return;
    const name = input.name;
    const value = input.value;
    render();
    const again = body.querySelector(`input[name="${name}"][value="${value}"]`);
    if (again) again.focus({ preventScroll: true });
  });
  provide("openSizeGuide", openSizeGuide);
}
