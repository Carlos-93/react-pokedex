import { useState } from 'react';
// Components
import Search from './components/Search/Search';
import Pokedex from './components/Pokedex/Pokedex';
import Footer from './components/Footer/Footer';
// Assets
import loadingImage from './assets/images/loading.gif';
import errorImage from './assets/images/error.gif';
// Styles
import './App.css';

export default function App() {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSearch(query) {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`PokeAPI ${response.status}`);
      setPokemon(await response.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="app">
      {loading && <img src={loadingImage} alt="Cargando..." />}
      {error && !loading && <img src={errorImage} alt="Error buscando Pokémon" />}
      {pokemon && !loading && !error && <Pokedex pokemon={pokemon} />}
      <Search onSearch={handleSearch} />
      <Footer />
    </div>
  );
}