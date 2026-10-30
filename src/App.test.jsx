import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders search button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
});

test('trims the query and ignores empty searches', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button', { name: /buscar/i });

  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.click(button);
  expect(fetch).not.toHaveBeenCalled();

  fireEvent.change(input, { target: { value: ' Pikachu ' } });
  fireEvent.click(button);
  expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/pikachu', expect.anything());
  expect(await screen.findByAltText('Error buscando Pokémon')).toBeInTheDocument();
  vi.unstubAllGlobals();
});

test('a newer search cancels the previous one', async () => {
  const mew = { name: 'mew', id: 151, sprites: { front_default: null }, types: [], stats: [] };
  // pikachu never resolves on its own; it only rejects when aborted, like real fetch
  const fetch = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    if (url.endsWith('/mew')) resolve({ ok: true, json: async () => mew });
  }));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button', { name: /buscar/i });

  fireEvent.change(input, { target: { value: 'pikachu' } });
  fireEvent.click(button);
  fireEvent.change(input, { target: { value: 'mew' } });
  fireEvent.click(button);

  expect(await screen.findByRole('heading', { name: 'MEW' })).toBeInTheDocument();
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(screen.queryByAltText('Error buscando Pokémon')).not.toBeInTheDocument();
  vi.unstubAllGlobals();
});