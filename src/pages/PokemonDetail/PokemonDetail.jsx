import { Link, useFetcher, useLoaderData } from 'react-router';
// API
import { getEvolutions, getPokemon, getResource, getSpecies } from '../../api/pokeapi';
import { getFavorites, setFavorite } from '../../api/favorites';
// Components
import TypeBadge from '../../components/TypeBadge/TypeBadge';
// Data
import { TYPES } from '../../data/types';
// Styles
import styles from './PokemonDetail.module.css';

// PokeAPI returns English names; unknown ones fall back to the API value
const STATS = {
    hp: 'PS', attack: 'Ataque', defense: 'Defensa',
    'special-attack': 'Ataque esp.', 'special-defense': 'Defensa esp.', speed: 'Velocidad',
};
const MAX_STAT = 255;

// Newest Spanish entry of a localized list; some recent Pokémon have none
const spanish = (entries) => entries.findLast((entry) => entry.language.name === 'es');
// Flavor texts keep the line breaks of the game screen
const flavor = (entries) => spanish(entries)?.flavor_text.replace(/\s+/g, ' ');
const spanishName = async (resource) => spanish((await getResource(resource)).names)?.name ?? resource.name;
const number = (id) => `#${String(id).padStart(4, '0')}`;

const getAbilities = (pokemon) => Promise.all(pokemon.abilities.map(async ({ ability, is_hidden }) => {
    const { names, flavor_text_entries } = await getResource(ability);
    return { name: spanish(names)?.name ?? ability.name, description: flavor(flavor_text_entries), hidden: is_hidden };
}));

const TIMES = { day: 'de día', night: 'de noche', dusk: 'al atardecer' };
const GENDERS = { 1: 'si es hembra', 2: 'si es macho' };
// relative_physical_stats compares Attack with Defense (Tyrogue)
const STATS_ORDER = { 1: 'con más Ataque que Defensa', 0: 'con Ataque igual a Defensa', '-1': 'con más Defensa que Ataque' };

// How a Pokémon evolves, in Spanish. Details come one per game; is_default marks the current one
// shortcut: rare conditions (party, steps, natures...) are not described, add them when one is missed
async function evolutionCondition(details) {
    const detail = details.find((d) => d.is_default) ?? details.at(-1);
    if (!detail) return null; // first stage
    const parts = [];
    if (detail.trigger.name === 'level-up') parts.push(detail.min_level ? `Nivel ${detail.min_level}` : 'Subir de nivel');
    else if (detail.trigger.name === 'use-item') parts.push(await spanishName(detail.item));
    else if (detail.trigger.name === 'trade') parts.push('Intercambio');
    else parts.push('Condición especial');
    if (detail.held_item) parts.push(`con ${await spanishName(detail.held_item)}`);
    if (detail.min_happiness) parts.push('con amistad alta');
    if (detail.min_affection) parts.push('con afecto alto');
    if (detail.min_beauty) parts.push('con belleza alta');
    if (detail.known_move) parts.push(`sabiendo ${await spanishName(detail.known_move)}`);
    if (detail.known_move_type) parts.push(`sabiendo un movimiento de tipo ${TYPES[detail.known_move_type.name]?.label ?? detail.known_move_type.name}`);
    if (detail.location) parts.push('en un lugar concreto');
    if (detail.needs_overworld_rain) parts.push('con lluvia');
    if (detail.turn_upside_down) parts.push('con la consola boca abajo');
    if (detail.relative_physical_stats != null) parts.push(STATS_ORDER[detail.relative_physical_stats]);
    if (GENDERS[detail.gender]) parts.push(GENDERS[detail.gender]);
    if (TIMES[detail.time_of_day]) parts.push(TIMES[detail.time_of_day]);
    return parts.join(' ');
}

export async function loader({ params }) {
    const pokemon = await getPokemon(params.name);
    const [species, abilities] = await Promise.all([getSpecies(pokemon), getAbilities(pokemon)]);
    const evolutions = await getEvolutions(species);
    // getEvolutions builds new objects on every call, so adding to them here is safe
    await Promise.all(evolutions.flat().map(async (evolution) => {
        evolution.condition = await evolutionCondition(evolution.details);
    }));
    return { pokemon, species, abilities, evolutions, favorite: getFavorites().includes(pokemon.id) };
}

// Heart button; the router reruns the loader afterwards, so `favorite` follows
export async function action({ params, request }) {
    const { id } = await getPokemon(params.name);
    setFavorite(id, (await request.formData()).get('favorite') === 'true');
    return null;
}

export default function PokemonDetail() {
    const { pokemon, species, abilities, evolutions, favorite: saved } = useLoaderData();
    const fetcher = useFetcher();
    // Show the new state while it is being saved
    const favorite = fetcher.formData ? fetcher.formData.get('favorite') === 'true' : saved;
    const name = spanish(species.names)?.name ?? pokemon.name;
    const genus = spanish(species.genera)?.genus;
    const description = flavor(species.flavor_text_entries);
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
                    alt={name} width="475" height="475"
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

                <h3>Habilidades</h3>
                <ul className={styles.abilities}>
                    {abilities.map(({ name, description, hidden }) => (
                        <li key={name}>
                            <strong>{name}</strong>
                            {hidden && <span className={styles.hidden}>Oculta</span>}
                            {description && <p>{description}</p>}
                        </li>
                    ))}
                </ul>
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
                                    {stage.map(({ id, name, condition }) => (
                                        <li key={id}>
                                            {/* By id: some species names are not Pokémon names (deoxys vs deoxys-normal) */}
                                            <Link to={`/pokemon/${id}`} aria-current={id === pokemon.id ? 'page' : undefined} className={styles.evolution}>
                                                <img
                                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                                                    alt="" width="475" height="475" loading="lazy"
                                                />
                                                <span>{number(id)}</span>
                                                <strong>{name}</strong>
                                                {condition && <small>{condition}</small>}
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