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
  expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/pikachu');
  expect(await screen.findByAltText('Error buscando Pokémon')).toBeInTheDocument();
  vi.unstubAllGlobals();
});