import styles from './Pokedex.module.css';

// PokeAPI returns English names; unknown ones fall back to the API value
const TYPES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo',
    fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
    rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
};
const STATS = {
    hp: 'PS', attack: 'Ataque', defense: 'Defensa',
    'special-attack': 'Ataque esp.', 'special-defense': 'Defensa esp.', speed: 'Velocidad',
};

export default function Pokedex({ pokemon }) {
    return (
        <div className={styles.card}>
            <img src={pokemon.sprites.front_default} alt={pokemon.name} className={styles.image} />
            <h1 className={styles.name}>{pokemon.name.toUpperCase()}</h1>
            <p><strong># {pokemon.id}</strong></p>

            <div className={styles.types}>
                <span>
                    <strong>{pokemon.types.length > 1 ? 'Tipos' : 'Tipo'}: </strong>
                    {pokemon.types.map(({ type }) => TYPES[type.name] ?? type.name).join(', ')}
                </span>
            </div>

            <ul className={styles.stats}>
                {pokemon.stats.map(({ stat, base_stat }) => (
                    <li key={stat.name}>
                        <strong>{STATS[stat.name] ?? stat.name}: </strong>{base_stat}
                    </li>
                ))}
            </ul>
        </div>
    );
}
