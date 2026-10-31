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

export const idFromUrl = (url) => Number(url.split('/').at(-2));

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

// Species and evolution chain come as full URLs inside other responses
const getUrl = (url) => getJSON(url.slice(API.length));

export const getSpecies = (pokemon) => getUrl(pokemon.species.url);

// Any { name, url } reference inside another response: abilities, items, moves...
export const getResource = ({ url }) => getUrl(url);

// A Pokémon with a single form gives it its own name (raichu-alola), so the forms list can look it up without the Pokémon
export const getForm = (name) => getJSON(`/pokemon-form/${name}/`);

// Evolution details give the gender as an id, not as a reference
export const getGender = (id) => getJSON(`/gender/${id}/`);

// Evolution tree flattened by stage: [[eevee], [vaporeon, jolteon, ...]]
export async function getEvolutions(species) {
  const { chain } = await getUrl(species.evolution_chain.url);
  const stages = [];
  (function add(node, depth) {
    (stages[depth] ??= []).push({ id: idFromUrl(node.species.url), name: node.species.name, details: node.evolution_details });
    node.evolves_to.forEach((next) => add(next, depth + 1));
  })(chain, 0);
  return stages;
}