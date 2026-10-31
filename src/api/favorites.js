// Favorite Pokémon ids, kept only in this browser
const KEY = 'favorites';

export function getFavorites() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(ids) ? ids : [];
  } catch {
    return []; // storage blocked (private mode, cookies off) or not valid JSON
  }
}

export function setFavorite(id, favorite) {
  const ids = getFavorites().filter((other) => other !== id);
  if (favorite) ids.push(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // storage blocked or full: nothing is saved and the button goes back to its old state
  }
}
