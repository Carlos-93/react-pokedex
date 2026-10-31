import { TYPES } from '../data/types';

const API = 'https://pokeapi.co/api/v2';
const cache = new Map();

// PokeAPI data never changes and its fair-use policy asks clients to cache, so each URL is fetched once per session
function getJSON(path) {
  if (!cache.has(path)) {
    const request = fetch(`${API}${path}`).then((response) => {
      // A thrown Response reaches the route's ErrorBoundary with its status (404 = not found)
      if (!response.ok) throw new Response(null, { status: response.status });
      return response.json();
    });
    request.catch(() => cache.delete(path)); // let a failed request be retried
    cache.set(path, request);
  }
  return cache.get(path);
}

const idFromUrl = (url) => Number(url.split('/').at(-2));

// Every Pokémon with its types from 19 small requests, instead of one request per Pokémon
export async function getPokedex() {
  const [list, ...types] = await Promise.all([
    getJSON('/pokemon?limit=100000'),
    ...Object.keys(TYPES).map((type) => getJSON(`/type/${type}`)),
  ]);

  const typesByName = {};
  for (const type of types) {
    for (const { pokemon, slot } of type.pokemon) {
      (typesByName[pokemon.name] ??= [])[slot - 1] = type.name;
    }
  }

  return list.results
    .map(({ name, url }) => ({ id: idFromUrl(url), name, types: typesByName[name] ?? [] }))
    .filter(({ id }) => id < 10000); // ids from 10001 are alternate forms (megas, regional forms...)
}

export const getPokemon = (name) => getJSON(`/pokemon/${encodeURIComponent(name.toLowerCase())}`);
