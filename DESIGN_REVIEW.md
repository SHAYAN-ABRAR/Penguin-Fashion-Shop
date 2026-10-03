# Penguin Fashion — design review

Base: `f957c1ef80f17ec60bc146231737634318f55166` on `main`.
Working branch: `design/editorial-campaign`.

## What changed

- Full-width original fashion campaign with the headline “GO OUT. STAND OUT.”
- Bold Inter typography, cool neutral surfaces, deep forest-charcoal and a chartreuse accent.
- Cleaner category links and product cards, a dark shoppable lookbook, a coastal brand story, and a large footer wordmark.
- Three original generated images in two responsive WebP sizes each, totaling approximately 609 KiB. Prompts and provenance are in `assets/img/editorial/README.md`.
- Updated mobile layouts, dialogs, bag and saved-item panels, README screenshots and the 404 page.
- Small-screen filter input containment and correct carousel slide positioning after layout changes.

## Preserved

All six products and their original photos, prices, product IDs, search, style/fit/hood filters, price sorting, deep links, zoom, size guide, wishlist, bag quantity controls, undo, local storage and the demo-only checkout behavior. No framework, database, service, authentication or build step was added.

## Verification

Ran in headless Chromium against the `/Penguin-Fashion-Shop/` base path, with desktop and phone interaction checks. These are functional smoke checks, not a full accessibility or cross-browser audit.

- All six catalog products load under the GitHub Pages subpath.
- Keyboard skip link.
- Style shortcut and URL filter persistence.
- Search, no-results recovery, and clearing filters.
- Price sorting.
- Fit and hood filters through the redesigned filter panel.
- Required size selection and adding a product to the bag.
- Product zoom and size guide.
- Bag and wishlist survive reload without changing storage keys.
- Bag quantity, subtotal, removal, undo, and Escape.
- Saved drawer removal and undo.
- Lookbook tabs, keyboard navigation, correct slide alignment, and shop-this-edit.
- Product deep link and modal dismissal.
- No horizontal overflow at 320px.
- No horizontal overflow at 390px.
- No horizontal overflow at 768px.
- No horizontal overflow at 1024px.
- No horizontal overflow at 1440px.
- No horizontal overflow at 1920px.
- Mobile menu, filters, product selection and add-to-bag.
- Zero JavaScript errors and zero failed asset requests during the checks.

Final desktop and mobile screenshots were visually reviewed. The final portrait framing and responsive image selection were also checked; every image loaded.

## Run

From this directory:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. On Windows, `python` may be the command instead of `python3`.

## GitHub status

The branch and changes were prepared locally. Nothing has been pushed, merged or deployed. The connected GitHub tools expose read operations, and the shell has no GitHub push authentication. The existing live site is unchanged.

The accompanying binary patch includes all edited files and image assets. Apply it to a clean checkout of the base commit using `git apply --check` first. The ZIP contains the complete working storefront and can be run directly after extraction.
