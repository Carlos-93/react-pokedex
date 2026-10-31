import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

const API = 'https://pokeapi.co/api/v2';
const list = [
  ...Array.from({ length: 30 }, (_, i) => ({ name: i ? `pokemon-${i + 1}` : 'butterfree', url: `${API}/pokemon/${i + 1}/` })),
  { name: 'pokemon-mega', url: `${API}/pokemon/10001/` }, // alternate form, must be hidden
];
// flying is fetched before bug, so slot order must win over request order
const types = { bug: [{ slot: 1, pokemon: list[0] }], flying: [{ slot: 2, pokemon: list[0] }] };
const pikachu = {
  id: 25, name: 'pikachu', height: 4, weight: 60,
  species: { url: `${API}/pokemon-species/25/` },
  sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
  types: [{ type: { name: 'electric' } }],
  stats: [{ stat: { name: 'hp' }, base_stat: 35 }, { stat: { name: 'speed' }, base_stat: 90 }],
};
const es = (key, value) => ({ language: { name: 'es' }, [key]: value });
const species = {
  names: [{ language: { name: 'ja' }, name: 'ピカチュウ' }, es('name', 'Pikachu')],
  genera: [es('genus', 'Pokémon Ratón')],
  // the newest Spanish text wins, without the game's line breaks
  flavor_text_entries: [es('flavor_text', 'Antiguo.'), es('flavor_text', 'Se saludan\nuniendo\fsus colas.'), { language: { name: 'en' }, flavor_text: 'English.' }],
  evolution_chain: { url: `${API}/evolution-chain/10/` },
};
const stage = (name, id, ...evolves_to) => ({ species: { name, url: `${API}/pokemon-species/${id}/` }, evolves_to });
const chain = { chain: stage('pichu', 172, stage('pikachu', 25, stage('raichu', 26))) };
let flakyCalls = 0;

const ok = (json) => ({ ok: true, json: async () => json });

function fakeFetch(url) {
  const path = url.replace(API, '');
  if (path === '/pokemon?limit=100000') return ok({ results: list });
  if (path.startsWith('/type/')) return ok({ name: path.slice(6), pokemon: types[path.slice(6)] ?? [] });
  if (path === '/pokemon/pikachu') return ok(pikachu);
  if (path === '/pokemon-species/25/') return ok(species);
  if (path === '/evolution-chain/10/') return ok(chain);
  // fails once with a server error, then works: a failed request must not stay cached
  if (path === '/pokemon/flaky') return ++flakyCalls === 1 ? { ok: false, status: 500 } : ok({ ...pikachu, name: 'flaky' });
  return { ok: false, status: 404 };
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (url) => fakeFetch(url))));
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

// Browser router, not memory: Search reads window.location
function renderAt(url) {
  window.history.replaceState(null, '', url);
  const router = createBrowserRouter(routes);
  render(<RouterProvider router={router} />);
  return router;
}

test('lists Pokémon by pages without alternate forms', async () => {
  renderAt('/');
  expect(screen.getByRole('status')).toHaveTextContent('Cargando');

  expect(await screen.findByText('30 Pokémon')).toBeInTheDocument();
  const cards = screen.getAllByRole('listitem');
  expect(cards).toHaveLength(24);
  expect(within(cards[0]).getAllByText(/^(Bicho|Volador)$/).map((badge) => badge.textContent)).toEqual(['Bicho', 'Volador']);

  fireEvent.click(screen.getByRole('link', { name: 'Siguiente' }));
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
  // focus moves in an effect, which can run after the new page is already on screen
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.queryByText('pokemon-mega')).not.toBeInTheDocument();
});

test('clamps an out of range page', async () => {
  renderAt('/?page=99');
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
});

test('search filters by name or number from any page without losing focus', async () => {
  const router = renderAt('/pokemon/pikachu');
  await screen.findByRole('heading', { level: 1, name: 'Pikachu' });
  const input = screen.getByRole('searchbox');
  input.focus();

  fireEvent.change(input, { target: { value: ' Butter' } });
  expect(await screen.findByText('1 Pokémon')).toBeInTheDocument();
  expect(router.state).toMatchObject({ location: { pathname: '/' }, historyAction: 'PUSH' });
  expect(input).toHaveValue(' Butter');

  // butterfree has no "1" in its name, so it only matches by its id
  fireEvent.change(input, { target: { value: '1' } });
  expect(await screen.findByText('12 Pokémon')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'butterfree' })).toBeInTheDocument();
  expect(router.state.historyAction).toBe('REPLACE');
  expect(input).toHaveFocus();
});

test('typing fast from another page adds a single history entry', async () => {
  const router = renderAt('/pokemon/pikachu');
  await screen.findByRole('heading', { level: 1, name: 'Pikachu' });
  const input = screen.getByRole('searchbox');

  // Next key right after the router commits, before React would render a transition
  const unsubscribe = router.subscribe((state) => {
    if (state.location.pathname !== '/') return;
    unsubscribe();
    queueMicrotask(() => fireEvent.change(input, { target: { value: 'bu' } }));
  });
  fireEvent.change(input, { target: { value: 'b' } });

  await waitFor(() => expect(router.state.location.search).toBe('?q=bu'));
  expect(router.state.historyAction).toBe('REPLACE');
});

test('type filter, pagination and search keep each other in the URL', async () => {
  renderAt('/?q=pokemon');
  expect(await screen.findByText('29 Pokémon')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'Siguiente' }));
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(5);

  // butterfree is the only flying one and does not match "pokemon"
  fireEvent.click(screen.getByRole('link', { name: 'Volador' }));
  expect(await screen.findByText('Ningún Pokémon coincide con la búsqueda.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'Todos' }));
  expect(await screen.findByText('29 Pokémon')).toBeInTheDocument();

  // clearing the search keeps the type: butterfree is the only bug one
  fireEvent.click(screen.getByRole('link', { name: 'Bicho' }));
  expect(await screen.findByText('0 Pokémon')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
  expect(await screen.findByText('1 Pokémon')).toBeInTheDocument();
});

test('detail shows Spanish texts, size, stats and the evolution chain', async () => {
  renderAt('/pokemon/pikachu');
  expect(await screen.findByRole('heading', { level: 1, name: 'Pikachu' })).toBeInTheDocument();
  expect(screen.getByText('Pokémon Ratón')).toBeInTheDocument();
  // textContent, not getByText: its default normalizer would hide the raw line breaks
  expect(screen.getByText(/Se saludan/).textContent).toBe('Se saludan uniendo sus colas.');
  expect(screen.getByText('0,4 m')).toBeInTheDocument();
  expect(screen.getByText('6 kg')).toBeInTheDocument();
  expect(screen.getByText('Total').nextSibling).toHaveTextContent('125');

  const evolutions = within(screen.getByRole('region', { name: 'Evoluciones' })).getAllByRole('link');
  expect(evolutions.map((link) => link.getAttribute('href'))).toEqual(['/pokemon/172', '/pokemon/25', '/pokemon/26']);
  expect(evolutions[1]).toHaveAttribute('aria-current', 'page');
});

test('the heart on the detail page saves favorites for /favoritos', async () => {
  localStorage.setItem('favorites', 'not json'); // broken storage counts as no favorites
  const router = renderAt('/favoritos');
  expect(await screen.findByText(/Aún no hay favoritos/)).toBeInTheDocument();

  router.navigate('/pokemon/pikachu');
  const heart = await screen.findByRole('button', { name: 'Favorito' });
  expect(heart).toHaveAttribute('aria-pressed', 'false');
  // on, off and on again: saved once, not twice
  for (const ids of [[25], [], [25]]) {
    fireEvent.click(heart);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('favorites'))).toEqual(ids));
    await waitFor(() => expect(heart).toHaveAttribute('aria-pressed', String(ids.length > 0)));
  }

  fireEvent.click(screen.getByRole('link', { name: 'Favoritos' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Favoritos' })).toBeInTheDocument();
  expect(screen.getByText('1 Pokémon')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'pokemon-25' })).toBeInTheDocument();
});

test.each(['/pokemon/missingno', '/no/existe'])('%s shows the not found page inside the layout', async (url) => {
  renderAt(url);
  expect(await screen.findByRole('heading', { name: 'No encontrado' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox')).toBeInTheDocument();
});

test('a failed request shows an error and can be retried', async () => {
  const router = renderAt('/pokemon/flaky');
  expect(await screen.findByRole('heading', { name: 'Algo ha fallado' })).toBeInTheDocument();

  router.navigate('/pokemon/flaky');
  expect(await screen.findByRole('heading', { level: 1, name: 'Pikachu' })).toBeInTheDocument();
});
