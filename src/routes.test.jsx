import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from './routes';

const API = 'https://pokeapi.co/api/v2';
const list = [
  ...Array.from({ length: 30 }, (_, i) => ({ name: `pokemon-${i + 1}`, url: `${API}/pokemon/${i + 1}/` })),
  { name: 'pokemon-mega', url: `${API}/pokemon/10001/` }, // alternate form, must be hidden
];
// flying is fetched before bug, so slot order must win over request order
const types = { bug: [{ slot: 1, pokemon: list[0] }], flying: [{ slot: 2, pokemon: list[0] }] };
const pikachu = {
  id: 25, name: 'pikachu',
  sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
  types: [{ type: { name: 'electric' } }],
  stats: [{ stat: { name: 'hp' }, base_stat: 35 }],
};
let flakyCalls = 0;

const ok = (json) => ({ ok: true, json: async () => json });

function fakeFetch(url) {
  const path = url.replace(API, '');
  if (path === '/pokemon?limit=100000') return ok({ results: list });
  if (path.startsWith('/type/')) return ok({ name: path.slice(6), pokemon: types[path.slice(6)] ?? [] });
  if (path === '/pokemon/pikachu') return ok(pikachu);
  // fails once with a server error, then works: a failed request must not stay cached
  if (path === '/pokemon/flaky') return ++flakyCalls === 1 ? { ok: false, status: 500 } : ok({ ...pikachu, name: 'flaky' });
  return { ok: false, status: 404 };
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (url) => fakeFetch(url))));
afterEach(() => vi.unstubAllGlobals());

function renderAt(url) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
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
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.queryByText('pokemon-mega')).not.toBeInTheDocument();
});

test('clamps an out of range page', async () => {
  renderAt('/?page=99');
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
});

test('search trims the query, ignores empty ones and opens the detail page', async () => {
  const router = renderAt('/');
  await screen.findByText('30 Pokémon');
  const input = screen.getByRole('searchbox');
  const button = screen.getByRole('button', { name: 'Buscar' });

  fireEvent.change(input, { target: { value: '   ' } });
  await act(async () => fireEvent.click(button));
  expect(router.state.location.pathname).toBe('/');

  fireEvent.change(input, { target: { value: ' Pikachu ' } });
  fireEvent.click(button);
  expect(await screen.findByRole('heading', { level: 1, name: 'pikachu' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/pokemon/pikachu');
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
  expect(await screen.findByRole('heading', { name: 'flaky' })).toBeInTheDocument();
});
