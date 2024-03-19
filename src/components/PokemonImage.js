import React from 'react';

// Function component to show the pokemon image
function PokemonImage({ imageUrl }) {
    return <img src={imageUrl} alt="Pokemon" className='pokemon-image' />;
}

export default PokemonImage;