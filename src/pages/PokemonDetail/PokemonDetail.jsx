import { Suspense, useState } from 'react';
import { Await, Link, useFetcher, useLoaderData } from 'react-router';
// API
import { getEvolutions, getForm, getGender, getPokemon, getResource, getSpecies, idFromUrl } from '../../api/pokeapi';
import { getFavorites, setFavorite } from '../../api/favorites';
// Components
import Loading from '../../components/Loading/Loading';
import TypeBadge from '../../components/TypeBadge/TypeBadge';
// Data
import { DETAIL_LABELS, TYPES, UNTRANSLATED } from '../../data/constants';
// Styles
import styles from './PokemonDetail.module.css';

// Every text shown comes from PokeAPI, in Spanish when it has a translation and as the API name when it does not.
// Form names try English before the API name: many forms (Gigamax, Pikachu Rock Star) have no Spanish one.
// Only the labels next to each value are written here, and in data/constants for the evolution conditions.
const MAX_STAT = 255;

// Newest Spanish entry of a localized list; some recent Pokémon have none
const spanish = (entries) => entries.findLast((entry) => entry.language.name === 'es');
// Flavor texts keep the line breaks of the game screen
const flavor = (entries) => spanish(entries)?.flavor_text.replace(/\s+/g, ' ');
const spanishName = async (resource) => spanish((await getResource(resource)).names)?.name ?? resource.name;
const spanishNames = async (resources) => (await Promise.all(resources.map(spanishName))).join(', ');
const yesNo = (value) => (value ? 'Sí' : 'No');

// "Forma de Alola", "Mega-Charizard X"...; none for the plain form of a Pokémon, whose form_name is empty
function formName(form) {
    if (!form?.form_name) return null;
    return (spanish(form.form_names) ?? form.form_names.find((entry) => entry.language.name === 'en'))?.name ?? form.form_name;
}

// Names of the cards in the forms section, the same as the heading of each form's page. null shows the species name:
// plain forms, and Pokémon that hold many forms (Alcremie), which have no form named like them
const getFormNames = (species) => species.varieties.length > 1
    ? Promise.all(species.varieties.map(({ pokemon }) => getForm(pokemon.name).then(formName, () => null)))
    : [];
const number = (id) => `#${String(id).padStart(4, '0')}`;
const artwork = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// Version groups have no names of their own: "Rojo / Azul" comes from their versions
async function getGroup(group) {
    const { order, versions } = await getResource(group);
    return { name: group.name, order, label: (await Promise.all(versions.map(spanishName))).join(' / ') };
}

const getAbilities = (pokemon) => Promise.all(pokemon.abilities.map(async ({ ability, is_hidden }) => {
    const { names, flavor_text_entries } = await getResource(ability);
    return { name: spanish(names)?.name ?? ability.name, description: flavor(flavor_text_entries), hidden: is_hidden };
}));

const getStats = (pokemon) => Promise.all(pokemon.stats.map(async ({ stat, base_stat, effort }) => (
    { name: await spanishName(stat), value: base_stat, effort }
)));

// [label, value] rows; shapes and growth rates have no Spanish names in PokeAPI, so they keep the API name
async function getProfile(pokemon, species, stats) {
    const rows = await Promise.all([
        ['Generación', spanishName(species.generation)],
        ['Color', spanishName(species.color)],
        ['Forma', species.shape?.name],
        ['Hábitat', species.habitat && spanishName(species.habitat)],
        ['Grupos huevo', spanishNames(species.egg_groups)],
        ['Ciclos de eclosión', species.hatch_counter],
        // gender_rate is the chance of being female in eighths, -1 for Pokémon without gender
        ['Hembras', species.gender_rate < 0 ? 'Sin sexo' : (species.gender_rate / 8).toLocaleString('es', { style: 'percent', maximumFractionDigits: 1 })],
        ['Diferencias por sexo', yesNo(species.has_gender_differences)],
        ['Ratio de captura', species.capture_rate],
        ['Felicidad base', species.base_happiness],
        ['Experiencia base', pokemon.base_experience],
        ['Crecimiento', species.growth_rate.name],
        ['Puntos de esfuerzo', stats.filter(({ effort }) => effort).map(({ effort, name }) => `${effort} ${name}`).join(', ')],
        ['Bebé', yesNo(species.is_baby)],
        ['Legendario', yesNo(species.is_legendary)],
        ['Singular', yesNo(species.is_mythical)],
        ['Formas intercambiables', yesNo(species.forms_switchable)],
    ].map(async ([label, value]) => [label, await value]));
    return rows.filter(([, value]) => value != null && value !== '');
}

// Damage multiplier of each attacking type, neutral ones left out: [[4, ['ground']], [0.5, [...]], ...]
async function getDefenses(pokemon) {
    const factors = {};
    for (const { damage_relations } of await Promise.all(pokemon.types.map(({ type }) => getResource(type)))) {
        for (const [key, factor] of [['double_damage_from', 2], ['half_damage_from', 0.5], ['no_damage_from', 0]]) {
            for (const { name } of damage_relations[key]) factors[name] = (factors[name] ?? 1) * factor;
        }
    }
    const groups = Object.groupBy(Object.keys(factors).filter((type) => factors[type] !== 1), (type) => factors[type]);
    return Object.entries(groups).map(([factor, types]) => [Number(factor), types]).sort((a, b) => b[0] - a[0]);
}

async function detailValue(key, value) {
    if (value === true) return 'Sí';
    if (key === 'gender') return (await getGender(value)).name;
    if (key === 'version_group') return (await getGroup(value)).label;
    if (Array.isArray(value)) return spanishNames(value);
    if (typeof value !== 'object') return String(value);
    // Random branch (Wurmple): a formula, its odds and the hidden values it reads, which have no Spanish name
    if (key === 'condition_expression') return `${value.percentage_chance} % (${value.variables.map(({ name }) => name).join(', ')})`;
    // A field PokeAPI adds later may be a plain object instead of a reference
    if (!value.url) return value.name ?? JSON.stringify(value);
    return UNTRANSLATED.has(key) ? value.name : spanishName(value);
}

// Every requirement as [label, API value], one list per game with the current method (is_default) first.
// Fields PokeAPI adds later show up too, under their API key.
export function evolutionConditions(details) {
    const sorted = details.toSorted((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    return Promise.all(sorted.map((detail) => {
        const keys = [...new Set([...Object.keys(DETAIL_LABELS), ...Object.keys(detail)])].filter((key) => {
            const value = detail[key];
            return key !== 'is_default' && value != null && value !== false && value.length !== 0;
        });
        return Promise.all(keys.map(async (key) => [DETAIL_LABELS[key] ?? key, await detailValue(key, detail[key])]));
    }));
}

async function getEvolutionStages(species) {
    const stages = await getEvolutions(species);
    // getEvolutions builds new objects on every call, so adding to them here is safe
    await Promise.all(stages.flat().map(async (evolution) => {
        evolution.conditions = await evolutionConditions(evolution.details);
    }));
    return stages;
}

// Every move with each game that teaches it; games sorted by release
async function getMoves(pokemon) {
    const moves = await Promise.all(pokemon.moves.map(async ({ move, version_group_details }) => {
        const data = await getResource(move);
        return {
            name: spanish(data.names)?.name ?? move.name,
            type: data.type.name,
            category: data.damage_class && await spanishName(data.damage_class),
            power: data.power,
            accuracy: data.accuracy,
            pp: data.pp,
            learned: await Promise.all(version_group_details.map(async ({ version_group, move_learn_method, level_learned_at }) => (
                { group: version_group.name, method: await spanishName(move_learn_method), level: level_learned_at }
            ))),
        };
    }));
    const groups = new Map(pokemon.moves.flatMap(({ version_group_details }) => version_group_details.map(({ version_group }) => [version_group.name, version_group])));
    return { moves, groups: (await Promise.all([...groups.values()].map(getGroup))).sort((a, b) => a.order - b.order) };
}

// Places, encounter methods and conditions have no Spanish names in PokeAPI, so they keep the API name
async function getEncounters(pokemon) {
    const areas = await getResource({ url: pokemon.location_area_encounters });
    return Promise.all(areas.flatMap(({ location_area, version_details }) => version_details.flatMap(({ version, encounter_details }) => (
        encounter_details.map(async ({ min_level, max_level, chance, method, condition_values }) => ({
            place: location_area.name,
            game: await spanishName(version),
            method: method.name,
            levels: min_level === max_level ? min_level : `${min_level}–${max_level}`,
            chance,
            conditions: condition_values.map((value) => value.name).join(', '),
        }))
    ))));
}

async function getGames(pokemon, species) {
    const [descriptions, pokedexes, items, encounters] = await Promise.all([
        Promise.all(species.flavor_text_entries.filter((entry) => entry.language.name === 'es').map(async ({ version, flavor_text }) => (
            [await spanishName(version), flavor_text.replace(/\s+/g, ' ')]
        ))),
        Promise.all(species.pokedex_numbers.map(async ({ pokedex, entry_number }) => [await spanishName(pokedex), entry_number])),
        Promise.all(pokemon.held_items.flatMap(({ item, version_details }) => version_details.map(async ({ version, rarity }) => (
            { item: await spanishName(item), game: await spanishName(version), rarity }
        )))),
        getEncounters(pokemon),
    ]);
    return { descriptions, pokedexes, items, encounters };
}

export async function loader({ params }) {
    const pokemon = await getPokemon(params.name);
    const [species, abilities, stats, defenses, form] = await Promise.all([
        getSpecies(pokemon), getAbilities(pokemon), getStats(pokemon), getDefenses(pokemon),
        // A Pokémon that holds many forms (Unown, Burmy) has no single form name
        pokemon.forms.length === 1 ? getResource(pokemon.forms[0]) : null,
    ]);
    return {
        pokemon, species, abilities, stats, defenses, form: formName(form),
        profile: await getProfile(pokemon, species, stats),
        favorite: getFavorites().includes(pokemon.id),
        // Not awaited: hundreds of requests the first time, so the page shows first and these fill in
        evolutions: getEvolutionStages(species),
        formNames: getFormNames(species),
        moves: getMoves(pokemon),
        games: getGames(pokemon, species),
    };
}

// Heart button; the router reruns the loader afterwards, so `favorite` follows
export async function action({ params, request }) {
    const { id } = await getPokemon(params.name);
    setFavorite(id, (await request.formData()).get('favorite') === 'true');
    return null;
}

// A failed request inside shows the route's error page, like the rest of the loader
function Later({ value, children }) {
    return (
        <Suspense fallback={<Loading />}>
            {/* A failing section stays in its place instead of replacing the whole page */}
            <Await resolve={value} errorElement={<p className={`${styles.panel} ${styles.wide}`}>No se pudo cargar esta parte desde PokeAPI.</p>}>
                {children}
            </Await>
        </Suspense>
    );
}

function Facts({ rows, className = styles.facts }) {
    return (
        <dl className={className}>
            {rows.map(([label, value], index) => (
                <div key={index}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>
    );
}

// Long tables scroll inside their panel; tabIndex lets keyboard users scroll them too
function Table({ labelledBy, head, rows }) {
    return (
        <div className={styles.scroll} tabIndex={0}>
            <table className={styles.table} aria-labelledby={labelledBy}>
                <thead>
                    <tr>{head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((cells, index) => (
                        <tr key={index}>{cells.map((cell, column) => <td key={column}>{cell ?? '—'}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Moves({ moves, groups }) {
    const [group, setGroup] = useState(groups.at(-1).name);
    const rows = moves
        .flatMap(({ learned, ...move }) => learned.filter((entry) => entry.group === group).map((entry) => ({ ...move, ...entry })))
        .sort((a, b) => a.method.localeCompare(b.method, 'es') || a.level - b.level || a.name.localeCompare(b.name, 'es'));

    return (
        <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="moves">
            <h2 id="moves">Movimientos</h2>
            <label className={styles.select}>
                Juego
                <select name="version-group" value={group} onChange={(event) => setGroup(event.target.value)}>
                    {groups.map(({ name, label }) => <option key={name} value={name}>{label}</option>)}
                </select>
            </label>
            <Table
                labelledBy="moves"
                head={['Método', 'Nivel', 'Movimiento', 'Tipo', 'Categoría', 'Potencia', 'Precisión', 'PP']}
                rows={rows.map(({ method, level, name, type, category, power, accuracy, pp }) => (
                    [method, level || null, name, <TypeBadge type={type} />, category, power, accuracy, pp]
                ))}
            />
        </section>
    );
}

export default function PokemonDetail() {
    const { pokemon, species, form, abilities, stats, profile, defenses, evolutions, formNames, moves, games, favorite: saved } = useLoaderData();
    const fetcher = useFetcher();
    // Show the new state while it is being saved
    const favorite = fetcher.formData ? fetcher.formData.get('favorite') === 'true' : saved;
    const name = spanish(species.names)?.name ?? pokemon.name;
    // An alternate form shows its own name: "Mega-Charizard X" on its own, "Forma de Alola" under "Raichu"
    const formOnly = form?.includes(name);
    const fullName = !form ? name : formOnly ? form : `${name} (${form})`;
    const genus = spanish(species.genera)?.genus;
    const description = flavor(species.flavor_text_entries);
    const total = stats.reduce((sum, { value }) => sum + value, 0);
    // Cry of the current games; some old forms only have the legacy one
    const cry = pokemon.cries.latest ?? pokemon.cries.legacy;

    return (
        <article className={styles.detail} style={{ '--type-color': TYPES[pokemon.types[0]?.type.name]?.color }}>
            <title>{`Pokédex - ${fullName}`}</title>

            <header className={styles.hero}>
                <div>
                    <p className={styles.id}>{number(pokemon.id)}</p>
                    {/* The space keeps "Raichu Forma de Alola" apart for screen readers */}
                    <h1 className={styles.name} tabIndex={-1}>
                        {formOnly ? form : name}
                        {form && !formOnly && <>{' '}<span className={styles.form}>{form}</span></>}
                    </h1>
                    {genus && <p className={styles.genus}>{genus}</p>}
                    <p className={styles.types}>
                        {pokemon.types.map(({ type }) => <TypeBadge key={type.name} type={type.name} />)}
                    </p>

                    <div className={styles.actions}>
                        {/* fetcher: saving adds no history entry and does not reload the page */}
                        <fetcher.Form method="post">
                            <button type="submit" name="favorite" value={String(!favorite)} aria-pressed={favorite} className={styles.favorite}>
                                Favorito
                            </button>
                        </fetcher.Form>

                        {cry && (
                            // A browser that cannot play the file (old Safari and .ogg) just stays silent
                            <button type="button" className={styles.cry} onClick={() => new Audio(cry).play().catch(() => { })}>
                                Grito
                            </button>
                        )}
                    </div>
                </div>

                <img
                    src={pokemon.sprites.other['official-artwork'].front_default ?? pokemon.sprites.front_default}
                    alt={fullName} width="475" height="475"
                    className={styles.image}
                />
            </header>

            <div className={styles.column}>
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
                        {stats.map(({ name, value }) => (
                            <div key={name} style={{ '--value': value / MAX_STAT }}>
                                <dt>{name}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                        <div className={styles.total}>
                            <dt>Total</dt>
                            <dd>{total}</dd>
                        </div>
                    </dl>
                </section>
            </div>

            <div className={styles.column}>
                <section className={styles.panel} aria-labelledby="profile">
                    <h2 id="profile">Datos de la especie</h2>
                    <Facts rows={profile} />
                </section>

                <section className={styles.panel} aria-labelledby="defenses">
                    <h2 id="defenses">Daño recibido</h2>
                    <Facts
                        className={styles.defenses}
                        rows={defenses.map(([factor, types]) => [
                            `×${factor.toLocaleString('es')}`,
                            types.map((type) => <TypeBadge key={type} type={type} />),
                        ])}
                    />
                </section>
            </div>

            <Later value={evolutions}>
                {(stages) => stages.length > 1 && (
                    <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="evolutions">
                        <h2 id="evolutions">Evoluciones</h2>
                        <ol className={styles.stages}>
                            {stages.map((stage, index) => (
                                <li key={index}>
                                    <ul>
                                        {stage.map(({ id, name, conditions }) => (
                                            <li key={id} className={styles.card}>
                                                {/* By id: some species names are not Pokémon names (deoxys vs deoxys-normal) */}
                                                <Link to={`/pokemon/${id}`} aria-current={id === pokemon.id ? 'page' : undefined}>
                                                    <img src={artwork(id)} alt="" width="475" height="475" loading="lazy" />
                                                    <span>{number(id)}</span>
                                                    <strong>{name}</strong>
                                                </Link>
                                                {conditions[0] && <Facts rows={conditions[0]} className={styles.conditions} />}
                                                {conditions.length > 1 && (
                                                    <details>
                                                        <summary>Otros juegos ({conditions.length - 1})</summary>
                                                        {conditions.slice(1).map((rows, index) => <Facts key={index} rows={rows} className={styles.conditions} />)}
                                                    </details>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </Later>

            {species.varieties.length > 1 && (
                <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="forms">
                    <h2 id="forms">Formas</h2>
                    <Later value={formNames}>
                        {(formNames) => (
                            <ul className={styles.cards}>
                                {species.varieties.map(({ pokemon: variety }, index) => {
                                    const id = idFromUrl(variety.url);
                                    return (
                                        <li key={id} className={styles.card}>
                                            <Link to={`/pokemon/${id}`} aria-current={id === pokemon.id ? 'page' : undefined}>
                                                <img src={artwork(id)} alt="" width="475" height="475" loading="lazy" />
                                                <strong>{formNames[index] ?? name}</strong>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Later>
                </section>
            )}

            <Later value={moves}>
                {({ moves, groups }) => groups.length > 0 && <Moves key={pokemon.id} moves={moves} groups={groups} />}
            </Later>

            <Later value={games}>
                {({ descriptions, pokedexes, items, encounters }) => (
                    <>
                        {descriptions.length > 0 && (
                            <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="descriptions">
                                <h2 id="descriptions">Descripciones por juego</h2>
                                <Facts rows={descriptions} className={styles.texts} />
                            </section>
                        )}

                        <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="pokedexes">
                            <h2 id="pokedexes">Número en cada Pokédex</h2>
                            <Facts rows={pokedexes} />
                        </section>

                        {items.length > 0 && (
                            <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="items">
                                <h2 id="items">Objetos que puede llevar</h2>
                                <Table labelledBy="items" head={['Objeto', 'Juego', 'Probabilidad']} rows={items.map(({ item, game, rarity }) => [item, game, `${rarity} %`])} />
                            </section>
                        )}

                        {encounters.length > 0 && (
                            <section className={`${styles.panel} ${styles.wide}`} aria-labelledby="encounters">
                                <h2 id="encounters">Dónde capturarlo</h2>
                                <Table
                                    labelledBy="encounters"
                                    head={['Lugar', 'Juego', 'Método', 'Nivel', 'Probabilidad', 'Condiciones']}
                                    rows={encounters.map(({ place, game, method, levels, chance, conditions }) => (
                                        [place, game, method, levels, `${chance} %`, conditions || null]
                                    ))}
                                />
                            </section>
                        )}
                    </>
                )}
            </Later>
        </article>
    );
}
