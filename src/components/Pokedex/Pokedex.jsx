import styles from './Pokedex.module.css';

export default function Pokedex({ pokemon }) {
    return (
        <div className={styles.card}>
            <img src={pokemon.sprites.front_default} alt={pokemon.name} className={styles.image} />
            <h1 className={styles.name}>{pokemon.name.toUpperCase()}</h1>
            <p><strong># {pokemon.id}</strong></p>

            <div className={styles.types}>
                <span><strong>Type: </strong>{pokemon.types.map(({ type }) => type.name).join(', ')}</span>
            </div>

            <ul className={styles.stats}>
                {pokemon.stats.map(({ stat, base_stat }) => (
                    <li key={stat.name}>
                        <strong>{stat.name}: </strong>{base_stat}
                    </li>
                ))}
            </ul>
        </div>
    );
}