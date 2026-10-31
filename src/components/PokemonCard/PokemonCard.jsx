import { Link } from 'react-router';
import TypeBadge from '../TypeBadge/TypeBadge';
import styles from './PokemonCard.module.css';

export default function PokemonCard({ pokemon }) {
    return (
        <Link to={`/pokemon/${pokemon.name}`} className={styles.card}>
            <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                alt=""
                width="475"
                height="475"
                loading="lazy"
                className={styles.image}
            />
            <span className={styles.id}>#{String(pokemon.id).padStart(4, '0')}</span>
            <h2 className={styles.name}>{pokemon.name}</h2>
            <span className={styles.types}>
                {pokemon.types.map((type) => <TypeBadge key={type} type={type} />)}
            </span>
        </Link>
    );
}
