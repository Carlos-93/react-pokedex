import { useLoaderData } from 'react-router';
import { getPokemon } from '../../api/pokeapi';
import TypeBadge from '../../components/TypeBadge/TypeBadge';
import styles from './PokemonDetail.module.css';

// PokeAPI returns English names; unknown ones fall back to the API value
const STATS = {
    hp: 'PS', attack: 'Ataque', defense: 'Defensa',
    'special-attack': 'Ataque esp.', 'special-defense': 'Defensa esp.', speed: 'Velocidad',
};

export const loader = ({ params }) => getPokemon(params.name);

export default function PokemonDetail() {
    const pokemon = useLoaderData();

    return (
        <article className={styles.card}>
            <title>{`${pokemon.name} | Pokédex`}</title>
            <img
                src={pokemon.sprites.other['official-artwork'].front_default ?? pokemon.sprites.front_default}
                alt={pokemon.name}
                width="475"
                height="475"
                className={styles.image}
            />

            <div>
                <p className={styles.id}>#{String(pokemon.id).padStart(4, '0')}</p>
                <h1 className={styles.name} tabIndex={-1}>{pokemon.name}</h1>
                <p className={styles.types}>
                    {pokemon.types.map(({ type }) => <TypeBadge key={type.name} type={type.name} />)}
                </p>

                <ul className={styles.stats}>
                    {pokemon.stats.map(({ stat, base_stat }) => (
                        <li key={stat.name}>
                            {STATS[stat.name] ?? stat.name}<strong>{base_stat}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
}
