import React, { useState } from 'react';

// Function component to search a pokemon
function PokemonSearch({ onSearch }) {
    const [inputValue, setInputValue] = useState('');

    // Function to handle the input change
    function handleInputChange(event) {
        setInputValue(event.target.value);
    }

    // Function to handle the submit
    function handleSubmit(event) {
        event.preventDefault();
        onSearch(inputValue);
    }

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Buscar Pokémon" className="search-input" />
            <button type="submit" className="search-button">Buscar Pokemon</button>
        </form>
    );
}

export default PokemonSearch;