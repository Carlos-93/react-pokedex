import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { pageSlots } from './pages/Home/Home';
import { evolutionConditions } from './pages/PokemonDetail/PokemonDetail';
import { routes } from './routes';

const API = 'https://pokeapi.co/api/v2';
const list = [
  ...Array.from({ length: 30 }, (_, i) => ({ name: i ? `pokemon-${i + 1}` : 'butterfree', url: `${API}/pokemon/${i + 1}/` })),
  { name: 'pokemon-mega', url: `${API}/pokemon/10001/` }, // alternate form, must be hidden
];
// flying is fetched before bug, so slot order must win over request order
const types = { bug: [{ slot: 1, pokemon: list[0] }], flying: [{ slot: 2, pokemon: list[0] }] };
const ref = (path, name = 'api-name') => ({ name, url: `${API}${path}` });
const redBlue = ref('/version-group/1/', 'red-blue');
const levelUp = ref('/move-learn-method/1/', 'level-up');
const pikachu = {
  id: 25, name: 'pikachu', height: 4, weight: 60, base_experience: 112,
  species: { url: `${API}/pokemon-species/25/` },
  forms: [ref('/pokemon-form/25/', 'pikachu')],
  sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
  cries: { latest: null, legacy: 'legacy.ogg' },
  types: [{ type: ref('/type/13/', 'electric') }, { type: ref('/type/18/', 'fairy') }],
  stats: [{ stat: ref('/stat/1/', 'hp'), base_stat: 35, effort: 0 }, { stat: ref('/stat/6/', 'speed'), base_stat: 90, effort: 2 }],
  abilities: [
    { ability: { name: 'static', url: `${API}/ability/9/` }, is_hidden: false },
    { ability: { name: 'lightning-rod', url: `${API}/ability/31/` }, is_hidden: true },
  ],
  moves: [
    {
      move: ref('/move/85/', 'thunderbolt'), version_group_details: [
        { version_group: ref('/version-group/25/', 'scarlet-violet'), move_learn_method: ref('/move-learn-method/4/', 'machine'), level_learned_at: 0 },
        { version_group: redBlue, move_learn_method: levelUp, level_learned_at: 26 },
      ],
    },
    { move: ref('/move/84/', 'thunder-shock'), version_group_details: [{ version_group: redBlue, move_learn_method: levelUp, level_learned_at: 1 }] },
  ],
  held_items: [{ item: ref('/item/132/', 'oran-berry'), version_details: [{ version: ref('/version/7/', 'ruby'), rarity: 50 }] }],
  location_area_encounters: `${API}/pokemon/25/encounters`,
};
const es = (key, value) => ({ language: { name: 'es' }, [key]: value });
const species = {
  names: [{ language: { name: 'ja' }, name: 'ピカチュウ' }, es('name', 'Pikachu')],
  genera: [es('genus', 'Pokémon Ratón')],
  // the newest Spanish text wins, without the game's line breaks
  flavor_text_entries: [
    { ...es('flavor_text', 'Antiguo.'), version: ref('/version/1/') },
    { ...es('flavor_text', 'Se saludan\nuniendo\fsus colas.'), version: ref('/version/7/') },
    { language: { name: 'en' }, flavor_text: 'English.', version: ref('/version/7/') },
  ],
  evolution_chain: { url: `${API}/evolution-chain/10/` },
  generation: ref('/generation/1/'), color: ref('/pokemon-color/10/'), shape: { name: 'quadruped' }, habitat: null,
  egg_groups: [ref('/egg-group/5/'), ref('/egg-group/6/')], hatch_counter: 10, gender_rate: 4, has_gender_differences: true,
  capture_rate: 190, base_happiness: 50, growth_rate: { name: 'medium' },
  is_baby: false, is_legendary: false, is_mythical: false, forms_switchable: false,
  pokedex_numbers: [{ entry_number: 25, pokedex: ref('/pokedex/1/') }],
  varieties: [{ pokemon: ref('/pokemon/25/', 'pikachu') }, { pokemon: ref('/pokemon/10080/', 'pikachu-rock-star') }],
};
const stage = (name, id, evolution_details, ...evolves_to) => ({ species: { name, url: `${API}/pokemon-species/${id}/` }, evolution_details, evolves_to });
const chain = {
  chain: stage('pichu', 172, [], stage('pikachu', 25, [{ trigger: { name: 'level-up' }, min_happiness: 220, version_group: redBlue }], stage('raichu', 26, [
    // one detail per game: the current one (is_default) goes first, the others are folded
    { trigger: { name: 'level-up' }, location: { name: 'old-place' } },
    { trigger: { name: 'use-item' }, item: { name: 'thunder-stone', url: `${API}/item/83/` }, is_default: true },
  ])))
};
const names = { // resources that only need their Spanish name
  '/stat/1/': 'PS', '/stat/6/': 'Velocidad', '/generation/1/': 'Generación I', '/pokemon-color/10/': 'Amarillo',
  '/egg-group/5/': 'Campo', '/egg-group/6/': 'Hada', '/item/83/': 'Piedra Trueno', '/item/132/': 'Baya Aranja',
  '/move-damage-class/3/': 'Especial', '/move-learn-method/1/': 'Nivel', '/move-learn-method/4/': 'Máquina',
  '/version/1/': 'Rojo', '/version/2/': 'Azul', '/version/7/': 'Rubí', '/version/40/': 'Escarlata', '/version/41/': 'Púrpura',
  '/pokedex/1/': 'Nacional', '/type/17/': 'Siniestro', '/nature/2/': 'Osada', '/nature/3/': 'Dócil',
};
const resources = {
  '/type/13/': { damage_relations: { double_damage_from: [{ name: 'ground' }], half_damage_from: [{ name: 'flying' }, { name: 'steel' }, { name: 'electric' }], no_damage_from: [] } },
  '/type/18/': { damage_relations: { double_damage_from: [{ name: 'flying' }], half_damage_from: [], no_damage_from: [{ name: 'dragon' }] } },
  '/move/85/': { names: [es('name', 'Rayo')], type: { name: 'electric' }, damage_class: ref('/move-damage-class/3/'), power: 90, accuracy: 100, pp: 15 },
  '/move/84/': { names: [es('name', 'Impactrueno')], type: { name: 'electric' }, damage_class: ref('/move-damage-class/3/'), power: 40, accuracy: 100, pp: 30 },
  // order, not the id, sorts the games
  '/version-group/1/': { order: 1, versions: [ref('/version/1/'), ref('/version/2/')] },
  '/version-group/25/': { order: 27, versions: [ref('/version/40/'), ref('/version/41/')] },
  '/pokemon/25/encounters': [{
    location_area: { name: 'viridian-forest-area' },
    version_details: [{ version: ref('/version/1/'), encounter_details: [{ min_level: 3, max_level: 5, chance: 5, method: { name: 'walk' }, condition_values: [] }] }],
  }],
  '/gender/2/': { name: 'male' },
  '/pokemon-form/25/': { form_name: '', form_names: [] }, // plain form: no form name
  '/pokemon-form/10094/': { form_name: 'alola-cap', form_names: [{ language: { name: 'en' }, name: 'Alola Cap' }, es('name', 'Gorra Alola')] },
  '/pokemon-form/10080/': { form_name: 'rock-star', form_names: [{ language: { name: 'en' }, name: 'Pikachu Rock Star' }] }, // no Spanish name
};
// The forms section looks forms up by name; /pokemon-form/pikachu/ is left out, so a failed lookup is covered too
resources['/pokemon-form/pikachu-rock-star/'] = resources['/pokemon-form/10080/'];
let flakyCalls = 0;

const ok = (json) => ({ ok: true, json: async () => json });

function fakeFetch(url) {
  const path = url.replace(API, '');
  if (names[path]) return ok({ names: [es('name', names[path])] });
  if (resources[path]) return ok(resources[path]);
  if (path === '/pokemon?limit=100000') return ok({ results: list });
  if (path.startsWith('/type/')) return ok({ name: path.slice(6), pokemon: types[path.slice(6)] ?? [] });
  if (path === '/pokemon/pikachu') return ok(pikachu);
  if (path === '/pokemon/pikachu-alola-cap') return ok({ ...pikachu, id: 10094, forms: [ref('/pokemon-form/10094/')] });
  if (path === '/pokemon/pikachu-rock-star') return ok({ ...pikachu, id: 10080, forms: [ref('/pokemon-form/10080/')] });
  if (path === '/pokemon-species/25/') return ok(species);
  if (path === '/evolution-chain/10/') return ok(chain);
  if (path === '/ability/9/') return ok({ names: [es('name', 'Electricidad Estática')], flavor_text_entries: [es('flavor_text', 'Puede paralizar\nal contacto.')] });
  if (path === '/ability/31/') return ok({ names: [], flavor_text_entries: [] }); // no Spanish texts
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
  expect(await screen.findByRole('link', { name: 'Página 2', current: 'page' })).toBeInTheDocument();
  // focus moves in an effect, which can run after the new page is already on screen
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  expect(screen.getAllByRole('listitem')).toHaveLength(6);
  expect(screen.queryByText('pokemon-mega')).not.toBeInTheDocument();
});

test('clamps an out of range page', async () => {
  renderAt('/?page=99');
  expect(await screen.findByRole('link', { name: 'Página 2', current: 'page' })).toBeInTheDocument();
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
  expect(await screen.findByRole('link', { name: 'Página 2', current: 'page' })).toBeInTheDocument();
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

test('detail shows the API data, with the slow parts filling in later', async () => {
  renderAt('/pokemon/pikachu');
  expect(await screen.findByRole('heading', { level: 1, name: 'Pikachu' })).toBeInTheDocument();
  expect(screen.getByText('Pokémon Ratón')).toBeInTheDocument();
  // textContent, not getByText: its default normalizer would hide the raw line breaks
  expect(screen.getByText(/Se saludan/).textContent).toBe('Se saludan uniendo sus colas.');
  expect(screen.getByText('0,4 m')).toBeInTheDocument();
  expect(screen.getByText('6 kg')).toBeInTheDocument();
  // without a current cry, the legacy one plays
  const played = [];
  vi.stubGlobal('Audio', class { constructor(src) { played.push(src); } play() { return Promise.resolve(); } });
  fireEvent.click(screen.getByRole('button', { name: 'Grito' }));
  expect(played).toEqual(['legacy.ogg']);
  const region = (name) => within(screen.getByRole('region', { name }));
  const value = (scope, label) => scope.getByText(label).nextSibling.textContent;

  // abilities in Spanish, or with the API name when there is no translation
  const info = region('Información');
  expect(info.getByText('Electricidad Estática')).toBeInTheDocument();
  expect(info.getByText('Puede paralizar al contacto.')).toBeInTheDocument();
  expect(info.getByText('lightning-rod').nextSibling).toHaveTextContent('Oculta');

  expect(value(region('Estadísticas base'), 'Velocidad')).toBe('90');
  expect(value(region('Estadísticas base'), 'Total')).toBe('125');

  const profile = region('Datos de la especie');
  expect(value(profile, 'Grupos huevo')).toBe('Campo, Hada');
  expect(value(profile, 'Hembras')).toMatch(/^50\s%$/);
  expect(value(profile, 'Forma')).toBe('quadruped'); // no Spanish name in the API
  expect(value(profile, 'Puntos de esfuerzo')).toBe('2 Velocidad');
  expect(value(profile, 'Diferencias por sexo')).toBe('Sí');
  expect(profile.queryByText('Hábitat')).not.toBeInTheDocument(); // null in the API

  // multipliers of both types combine: flying (×0.5 and ×2) ends neutral and is left out
  const defenses = region('Daño recibido');
  expect(defenses.getAllByRole('term').map((term) => [term.textContent, term.nextSibling.textContent])).toEqual([
    ['×2', 'Tierra'], ['×0,5', 'AceroEléctrico'], ['×0', 'Dragón'],
  ]);

  // the plain form shows the species name, the others their form name
  const forms = await region('Formas').findAllByRole('link');
  expect(forms.map((link) => [link.getAttribute('href'), link.textContent])).toEqual([['/pokemon/25', 'Pikachu'], ['/pokemon/10080', 'Pikachu Rock Star']]);

  const evolutions = within(await screen.findByRole('region', { name: 'Evoluciones' })).getAllByRole('link');
  expect(evolutions.map((link) => link.getAttribute('href'))).toEqual(['/pokemon/172', '/pokemon/25', '/pokemon/26']);
  expect(evolutions[1]).toHaveAttribute('aria-current', 'page');
  const [pikachuCard, raichuCard] = [evolutions[1], evolutions[2]].map((link) => within(link.closest('li')));
  expect(value(pikachuCard, 'Juego')).toBe('Rojo / Azul');
  expect(value(pikachuCard, 'Método')).toBe('level-up');
  expect(value(pikachuCard, 'Amistad mínima')).toBe('220');
  expect(raichuCard.getAllByText('Objeto')).toHaveLength(1);
  expect(value(raichuCard, 'Objeto')).toBe('Piedra Trueno');
  expect(raichuCard.getByText('Otros juegos (1)')).toBeInTheDocument();
  expect(value(raichuCard, 'Lugar')).toBe('old-place');

  // newest game first; another game shows its own moves
  const moves = within(await screen.findByRole('region', { name: 'Movimientos' }));
  const rows = () => moves.getAllByRole('row').slice(1).map((row) => [...row.cells].map((cell) => cell.textContent));
  expect(moves.getByRole('combobox', { name: 'Juego' })).toHaveDisplayValue('Escarlata / Púrpura');
  expect(rows()).toEqual([['Máquina', '—', 'Rayo', 'Eléctrico', 'Especial', '90', '100', '15']]);
  fireEvent.change(moves.getByRole('combobox'), { target: { value: 'red-blue' } });
  expect(rows().map((cells) => cells.slice(0, 3))).toEqual([['Nivel', '1', 'Impactrueno'], ['Nivel', '26', 'Rayo']]);

  expect(value(within(await screen.findByRole('region', { name: 'Descripciones por juego' })), 'Rojo')).toBe('Antiguo.');
  expect(value(region('Número en cada Pokédex'), 'Nacional')).toBe('25');
  expect(region('Objetos que puede llevar').getByRole('row', { name: /^Baya Aranja Rubí 50\s%$/ })).toBeInTheDocument();
  expect(region('Dónde capturarlo').getByRole('row', { name: /^viridian-forest-area Rojo walk 3–5 5\s% —$/ })).toBeInTheDocument();
});

test('evolution conditions list every API field, current method first', async () => {
  const conditions = await evolutionConditions([
    {
      trigger: { name: 'level-up' }, location: { name: 'eterna-forest' }, near_special_rock: true, min_level: null, is_default: false,
      // Shape of Wurmple's random branch, an object with no url
      condition_expression: { expression: 'PID 16 >> 10 % 4 <=', percentage_chance: 50, variables: [{ name: 'personality-value', url: 'x' }] },
    },
    {
      trigger: { name: 'recoil-damage' }, min_damage_taken: 294, gender: 2, relative_physical_stats: 0, is_default: true,
      party_type: ref('/type/17/', 'dark'), allowed_natures: [ref('/nature/2/'), ref('/nature/3/')], some_new_field: 'x', some_new_object: { name: 'y' },
    },
  ]);
  expect(conditions).toEqual([
    [
      ['Método', 'recoil-damage'], ['Daño mínimo recibido', '294'], ['Tipo en el equipo', 'Siniestro'], ['Sexo', 'male'],
      ['Ataque frente a Defensa', '0'], ['Naturalezas', 'Osada, Dócil'], ['some_new_field', 'x'], ['some_new_object', 'y'],
    ],
    [['Método', 'level-up'], ['Lugar', 'eterna-forest'], ['Cerca de una roca especial', 'Sí'], ['Condición', '50 % (personality-value)']],
  ]);
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
test('pagination always shows 7 slots: first, last, current with its neighbors and gaps', () => {
  expect(pageSlots(2, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(pageSlots(4, 43)).toEqual([1, 2, 3, 4, 5, null, 43]);
  expect(pageSlots(5, 43)).toEqual([1, null, 4, 5, 6, null, 43]);
  expect(pageSlots(40, 43)).toEqual([1, null, 39, 40, 41, 42, 43]);
});

test('an alternate form shows its own name under the Pokémon name', async () => {
  renderAt('/pokemon/pikachu-alola-cap');
  expect(await screen.findByRole('heading', { level: 1, name: 'Pikachu Gorra Alola' })).toBeInTheDocument();
  await waitFor(() => expect(document.title).toBe('Pokédex - Pikachu (Gorra Alola)'));
});

test('a form name that already names the Pokémon replaces it, in English when there is no Spanish one', async () => {
  renderAt('/pokemon/pikachu-rock-star');
  expect(await screen.findByRole('heading', { level: 1, name: 'Pikachu Rock Star' })).toBeInTheDocument();
});

test('the theme button stores a theme only while it differs from the system one', async () => {
  document.head.innerHTML = '<meta name="color-scheme" content="light dark">';
  const meta = document.head.firstChild;
  vi.stubGlobal('matchMedia', () => ({ matches: false })); // system theme: light
  renderAt('/');
  const button = await screen.findByRole('button', { name: 'Cambiar entre tema claro y oscuro' });

  fireEvent.click(button);
  expect([meta.content, localStorage.getItem('color-scheme')]).toEqual(['dark', 'dark']);
  fireEvent.click(button);
  expect([meta.content, localStorage.getItem('color-scheme')]).toEqual(['light dark', null]);

  // dark stored while the system was light, then the system turned dark: one click goes light, and stays light
  meta.content = 'dark';
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  fireEvent.click(button);
  expect([meta.content, localStorage.getItem('color-scheme')]).toEqual(['light', 'light']);
});
