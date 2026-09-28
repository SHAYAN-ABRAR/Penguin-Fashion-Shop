/* Penguin Fashion — the catalog. The one source of product data for cards, the product view,
 * the Winter Edit, the bag and the wishlist.
 *
 * This is a demo catalog. Names and descriptions come from what each photo shows, and the prices
 * and sizes are sample values. Nothing here is for sale. */

export const CURRENCY = "USD";
export const MAX_QUANTITY = 10;

export const STYLES = [
  { id: "coats", label: "Coats", single: "Coat" },
  { id: "rain", label: "Rain jackets", single: "Rain jacket" },
  { id: "biker", label: "Biker jackets", single: "Biker jacket" },
  { id: "puffers", label: "Puffers", single: "Puffer" },
];

export const FITS = [
  { id: "women", label: "Women's" },
  { id: "men", label: "Men's" },
];

export const SIZES = {
  women: ["XS", "S", "M", "L", "XL"],
  men: ["S", "M", "L", "XL", "XXL"],
};

/* Sample body measurements for the size guide, in centimetres. They are typical body measurements
 * for a demo shop, not measurements taken from these garments. */
export const SIZE_CHART = {
  women: [
    { size: "XS", chest: [80, 84], waist: [62, 66], sleeve: 57 },
    { size: "S", chest: [84, 88], waist: [66, 70], sleeve: 58 },
    { size: "M", chest: [88, 93], waist: [70, 75], sleeve: 59 },
    { size: "L", chest: [93, 99], waist: [75, 81], sleeve: 60 },
    { size: "XL", chest: [99, 105], waist: [81, 87], sleeve: 61 },
  ],
  men: [
    { size: "S", chest: [88, 94], waist: [74, 80], sleeve: 62 },
    { size: "M", chest: [94, 100], waist: [80, 86], sleeve: 63 },
    { size: "L", chest: [100, 106], waist: [86, 92], sleeve: 64 },
    { size: "XL", chest: [106, 112], waist: [92, 98], sleeve: 65 },
    { size: "XXL", chest: [112, 118], waist: [98, 104], sleeve: 66 },
  ],
};

export const PRODUCTS = [
  {
    id: "marigold-pea-coat",
    number: 1,
    name: "Marigold Pea Coat",
    style: "coats",
    fit: "women",
    hooded: false,
    price: 245,
    color: { name: "Marigold yellow", swatch: "#d49a1c" },
    image: "marigold-pea-coat",
    alt: "The Marigold Pea Coat: a double-breasted marigold-yellow coat with wide lapels, two patch pockets and buttoned cuff tabs.",
    summary: "Double-breasted, with wide lapels and deep patch pockets.",
    description:
      "A double-breasted pea coat in warm marigold. Wide lapels, two deep patch pockets and buttoned cuff tabs keep it classic, and a gently shaped waist leaves room for knitwear underneath.",
    features: ["Double-breasted button front", "Wide notch lapels", "Two patch pockets", "Buttoned cuff tabs"],
  },
  {
    id: "primrose-rain-jacket",
    number: 2,
    name: "Primrose Rain Jacket",
    style: "rain",
    fit: "women",
    hooded: true,
    price: 185,
    color: { name: "Primrose yellow", swatch: "#e2c15c" },
    image: "primrose-rain-jacket",
    alt: "The Primrose Rain Jacket: a pale yellow hooded jacket with toggle drawcords, a snap storm flap, flap pockets and a navy printed lining.",
    summary: "A light hooded shell with toggles and flap pockets.",
    description:
      "A hip-length rain jacket in soft primrose. The hood has toggle drawcords, a snap-down storm flap covers the zip, and there are two flap pockets and a zipped chest pocket. The navy printed lining shows when the hood is down.",
    features: ["Hood with toggle drawcords", "Zip with a snap storm flap", "Two flap pockets and a zipped chest pocket", "Navy printed lining"],
  },
  {
    id: "poppy-biker-jacket",
    number: 3,
    name: "Poppy Biker Jacket",
    style: "biker",
    fit: "women",
    hooded: false,
    price: 265,
    color: { name: "Poppy red", swatch: "#d43a2c" },
    image: "poppy-biker-jacket",
    alt: "The Poppy Biker Jacket: a cropped red biker jacket with an asymmetric zip, snap-down lapels and ribbed panels on the shoulders and sleeves.",
    summary: "Cropped, with an asymmetric zip and ribbed sleeves.",
    description:
      "A cropped biker jacket in poppy red. An asymmetric zip, snap-down lapels and ribbed panels on the shoulders and sleeves give it the classic shape, and buckled tabs finish the waist.",
    features: ["Asymmetric front zip", "Snap-down lapels", "Zipped chest and hand pockets", "Ribbed shoulder and sleeve panels", "Buckled waist tabs"],
  },
  {
    id: "summit-color-block-puffer",
    number: 4,
    name: "Summit Color-Block Puffer",
    style: "puffers",
    fit: "men",
    hooded: true,
    price: 295,
    color: { name: "Slate grey and yellow", swatch: "linear-gradient(135deg, #77776f 50%, #e3c21d 50%)" },
    image: "summit-color-block-puffer",
    alt: "The Summit Color-Block Puffer: a hooded puffer in slate grey with a bright yellow quilted panel across the body and a zipped chest pocket.",
    summary: "Slate grey and bright yellow, with a peaked hood.",
    description:
      "A hooded puffer in slate grey with a bright yellow quilted panel sweeping across the body. There's a vertical zipped chest pocket and tabbed cuffs, and the hood has a small peak.",
    features: ["Hood with a small peak", "Horizontal quilting", "Vertical zipped chest pocket", "Tabbed cuffs"],
  },
  {
    id: "oxblood-moto-jacket",
    number: 5,
    name: "Oxblood Moto Jacket",
    style: "biker",
    fit: "men",
    hooded: false,
    price: 325,
    color: { name: "Oxblood", swatch: "#6a1f2a" },
    image: "oxblood-moto-jacket",
    alt: "The Oxblood Moto Jacket: a deep red-brown jacket with a band collar, epaulettes, two snap-flap chest pockets and snap tabs at the hem.",
    summary: "A band collar, epaulettes and snap-flap pockets.",
    description:
      "A close-fitting jacket in deep oxblood, with a band collar, epaulettes and two snap-flap chest pockets. Snap tabs at the hem and a straight zip keep the lines clean, in the spirit of a café racer.",
    features: ["Band collar with a snap tab", "Epaulettes", "Two snap-flap chest pockets", "Snap tabs at the hem"],
  },
  {
    id: "midnight-quilted-puffer",
    number: 6,
    name: "Midnight Quilted Puffer",
    style: "puffers",
    fit: "men",
    hooded: true,
    price: 215,
    color: { name: "Midnight navy", swatch: "#232a3b" },
    image: "midnight-quilted-puffer",
    alt: "The Midnight Quilted Puffer: a slim navy puffer with narrow chevron quilting, a full-length zip and a close-fitting hood.",
    summary: "Slim chevron quilting and a close-fitting hood.",
    description:
      "A slim hooded puffer in midnight navy. Narrow chevron quilting keeps it close to the body, so it works as an outer layer on crisp days or under a coat when it's colder.",
    features: ["Close-fitting hood", "Narrow chevron quilting", "Full-length zip", "Slim, close fit"],
  },
];

/* The Winter Edit: three looks built from the catalog. The first product in each list is the lead
 * image of that edit's composition. */
export const EDITS = [
  {
    id: "everyday",
    title: "The Everyday Edit",
    short: "Everyday",
    tone: "stone",
    products: ["midnight-quilted-puffer", "marigold-pea-coat", "oxblood-moto-jacket"],
    idea: "One layer for every kind of day: the slim puffer for early starts, the pea coat when you want to look put together, and the moto jacket for evenings out.",
    styling: "Keep the rest simple: dark denim, a grey knit and leather boots.",
  },
  {
    id: "bold-color",
    title: "The Bold Color Edit",
    short: "Bold color",
    tone: "blush",
    products: ["poppy-biker-jacket", "marigold-pea-coat", "primrose-rain-jacket"],
    idea: "Grey skies need a little heat. Let one bright layer do the talking, and keep everything underneath quiet.",
    styling: "Charcoal, cream or black underneath keeps the color the focus.",
  },
  {
    id: "weekend",
    title: "The Weekend Edit",
    short: "Weekend",
    tone: "olive",
    products: ["summit-color-block-puffer", "primrose-rain-jacket", "midnight-quilted-puffer"],
    idea: "For early trains, long walks and changeable weather: hoods up, pockets zipped, hands free.",
    styling: "Add a fleece, sturdy boots and a warm hat.",
  },
];

export const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
export const styleById = Object.fromEntries(STYLES.map((s) => [s.id, s]));
export const fitById = Object.fromEntries(FITS.map((f) => [f.id, f]));
export const editById = Object.fromEntries(EDITS.map((e) => [e.id, e]));

export function sizesFor(product) {
  return SIZES[product.fit] || [];
}

/* Image paths, relative to the page, so the site works under /Penguin-Fashion-Shop/ on GitHub Pages. */
export function imageSrc(product, width) {
  return `assets/img/products/${product.image}-${width}.webp`;
}
export function imageSrcset(product) {
  return `${imageSrc(product, 200)} 200w, ${imageSrc(product, 400)} 400w, ${imageSrc(product, 720)} 720w`;
}
