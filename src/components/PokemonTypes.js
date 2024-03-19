// Function component types of pokemon
function PokemonTypes({ types }) {
    const typeNames = types.map((typeInfo) => typeInfo.type.name);
    const combinedTypes = typeNames.join(', ');

    return (
        <div className='pokemon-types'>
            <span><strong>Type: </strong>{combinedTypes}</span>
        </div>
    );
}
export default PokemonTypes;