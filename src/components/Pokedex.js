import React from 'react';
import PokemonImage from './PokemonImage';
import PokemonName from './PokemonName';
import PokemonTypes from './PokemonTypes';
import PokemonStats from './PokemonStats';

// Function component to show the pokemon card
function PokemonCard({ pokemon, errorImage }) {
    if (!pokemon || !pokemon.sprites) {
        return (
            <div className='pokemon-card'>
                <img className='loading-error-image' src={errorImage} alt="Error" />
            </div>
        );
    }

    return (
        <div className='pokemon-card'>
            <PokemonImage imageUrl={pokemon.sprites.front_default} />
            <PokemonName name={pokemon.name} />
            <strong><p># {pokemon.id}</p></strong>
            <PokemonTypes types={pokemon.types} />
            <PokemonStats stats={pokemon.stats} />
        </div>
    );
}

export default PokemonCard;