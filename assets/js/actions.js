/* Penguin Fashion — a small registry of page actions (open a product, open the bag, apply a filter),
 * so modules can call each other without importing each other. */

const handlers = new Map();

export function provide(name, handler) {
  handlers.set(name, handler);
}

export function run(name, ...args) {
  const handler = handlers.get(name);
  if (!handler) {
    console.warn(`No handler for action "${name}"`);
    return undefined;
  }
  return handler(...args);
}
