// Wishlist persistence + cross-component notification.
//
// The wishlist lives in localStorage under `wishlist` as a string[] of product
// ids. Mutations dispatch a `wishlistUpdated` window event so the navbar badge
// and the wishlist page can refresh live within the same tab (the native
// `storage` event only fires in *other* tabs, never the one that made the
// change).

const KEY = "wishlist";
export const WISHLIST_EVENT = "wishlistUpdated";

/** Reads the wishlist, tolerating missing/corrupted/legacy localStorage values. */
export function getWishlist(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Toggles an id, persists, and notifies listeners. Returns the new membership. */
export function toggleWishlist(id: string): boolean {
  const current = getWishlist();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (private mode) — fail quietly, don't crash the UI.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }

  return !exists;
}
