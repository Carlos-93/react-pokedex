import { Link, useFetcher, useLoaderData } from 'react-router';
import { getFavorites, setFavorite } from '../../api/favorites';
import { getEvolutions, getPokemon, getSpecies } from '../../api/pokeapi';
import TypeBadge from '../../components/TypeBadge/TypeBadge';
import { TYPES } from '../../data/types';
import styles from './PokemonDetail.module.css';

// PokeAPI returns English names; unknown ones fall back to the API value
const STATS = {
    hp: 'PS', attack: 'Ataque', defense: 'Defensa',
    'special-attack': 'Ataque esp.', 'special-defense': 'Defensa esp.', speed: 'Velocidad',
};
const MAX_STAT = 255;

// Newest Spanish entry of a localized list; some recent Pokémon have none
const spanish = (entries) => entries.findLast((entry) => entry.language.name === 'es');
const number = (id) => `#${String(id).padStart(4, '0')}`;

export async function loader({ params }) {
    const pokemon = await getPokemon(params.name);
    const species = await getSpecies(pokemon);
    return { pokemon, species, evolutions: await getEvolutions(species), favorite: getFavorites().includes(pokemon.id) };
}

// Heart button; the router reruns the loader afterwards, so `favorite` follows
export async function action({ params, request }) {
    const { id } = await getPokemon(params.name);
    setFavorite(id, (await request.formData()).get('favorite') === 'true');
    return null;
}

export default function PokemonDetail() {
    const { pokemon, species, evolutions, favorite: saved } = useLoaderData();
    const fetcher = useFetcher();
    // Show the new state while it is being saved
    const favorite = fetcher.formData ? fetcher.formData.get('favorite') === 'true' : saved;
    const name = spanish(species.names)?.name ?? pokemon.name;
    const genus = spanish(species.genera)?.genus;
    // Flavor texts keep the line breaks of the game screen
    const description = spanish(species.flavor_text_entries)?.flavor_text.replace(/\s+/g, ' ');
    const total = pokemon.stats.reduce((sum, { base_stat }) => sum + base_stat, 0);

    return (
        <article className={styles.detail} style={{ '--type-color': TYPES[pokemon.types[0]?.type.name]?.color }}>
            <title>{`${name} | Pokédex`}</title>

            <header className={styles.hero}>
                <div>
                    <p className={styles.id}>{number(pokemon.id)}</p>
                    <h1 className={styles.name} tabIndex={-1}>{name}</h1>
                    {genus && <p className={styles.genus}>{genus}</p>}
                    <p className={styles.types}>
                        {pokemon.types.map(({ type }) => <TypeBadge key={type.name} type={type.name} />)}
                    </p>
                    {/* fetcher: saving adds no history entry and does not reload the page */}
                    <fetcher.Form method="post">
                        <button type="submit" name="favorite" value={String(!favorite)} aria-pressed={favorite} className={styles.favorite}>
                            Favorito
                        </button>
                    </fetcher.Form>
                </div>
                <img
                    src={pokemon.sprites.other['official-artwork'].front_default ?? pokemon.sprites.front_default}
                    alt={name}
                    width="475"
                    height="475"
                    className={styles.image}
                />
            </header>

            <section className={styles.panel} aria-labelledby="about">
                <h2 id="about">Información</h2>
                {description && <p>{description}</p>}
                <dl className={styles.size}>
                    <div>
                        <dt>Altura</dt>
                        <dd>{(pokemon.height / 10).toLocaleString('es', { style: 'unit', unit: 'meter' })}</dd>
                    </div>
                    <div>
                        <dt>Peso</dt>
                        <dd>{(pokemon.weight / 10).toLocaleString('es', { style: 'unit', unit: 'kilogram' })}</dd>
                    </div>
                </dl>
            </section>

            <section className={styles.panel} aria-labelledby="stats">
                <h2 id="stats">Estadísticas base</h2>
                <dl className={styles.stats}>
                    {pokemon.stats.map(({ stat, base_stat }) => (
                        <div key={stat.name} style={{ '--value': base_stat / MAX_STAT }}>
                            <dt>{STATS[stat.name] ?? stat.name}</dt>
                            <dd>{base_stat}</dd>
                        </div>
                    ))}
                    <div className={styles.total}>
                        <dt>Total</dt>
                        <dd>{total}</dd>
                    </div>
                </dl>
            </section>

            {evolutions.length > 1 && (
                <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="evolutions">
                    <h2 id="evolutions">Evoluciones</h2>
                    <ol className={styles.stages}>
                        {evolutions.map((stage, index) => (
                            <li key={index}>
                                <ul>
                                    {stage.map(({ id, name }) => (
                                        <li key={id}>
                                            {/* By id: some species names are not Pokémon names (deoxys vs deoxys-normal) */}
                                            <Link to={`/pokemon/${id}`} aria-current={id === pokemon.id ? 'page' : undefined} className={styles.evolution}>
                                                <img
                                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                                                    alt=""
                                                    width="475"
                                                    height="475"
                                                    loading="lazy"
                                                />
                                                <span>{number(id)}</span>
                                                <strong>{name}</strong>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </article>
    );
}
