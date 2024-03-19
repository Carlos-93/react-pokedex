// Function component name of pokemon
function PokemonName({ name, data }) {
    const uppercaseName = name.toUpperCase();

    return (
        <div>
            <h1 className='pokemon-name'>{uppercaseName}</h1>
            {data && (
                <p style={{ textAlign: 'center' }}>
                    <strong>#{data.id}</strong>
                </p>
            )}
        </div>
    );
}

export default PokemonName;