import React, { useState } from 'react';
import axios from 'axios';
import PokemonSearch from './components/PokemonSearch';
import Pokedex from './components/Pokedex';
import ErrorImage from './img/error.gif';
import LoadingImage from './img/loading.gif';
import Footer from './components/Footer';
import './styles/App.css';

// Principal Function component 
export default function App() {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Function async to search a Pokémon
  async function handleSearch(query) {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
      if (response.status !== 200) {
        console.error('Error en la respuesta:', response.status);
        setError(true);
        return;
      }
      const data = response.data;
      setPokemon(data);
    } catch (error) {
      console.error('Error de red:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="app">
      {loading && <img className='loading-error-image' src={LoadingImage} alt="Cargando..." />}
      {error && !loading && <img className='loading-error-image' src={ErrorImage} alt="Error buscando Pokémon" />}
      {pokemon && !loading && !error && <Pokedex pokemon={pokemon} errorImage={ErrorImage} />}
      <PokemonSearch onSearch={handleSearch} />
      <Footer />
    </div>
  );
}