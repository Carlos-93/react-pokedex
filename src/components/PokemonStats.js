import React from 'react';

// Function component to show the pokemon stats
function PokemonStats({ stats }) {
    return (
        <ul className='pokemon-stats'>
            {stats.map(({ stat: { name }, base_stat }) => (
                <li key={name}>
                    <strong>{name}: </strong>{base_stat}
                </li>
            ))}
        </ul>
    );
}

export default PokemonStats;