import { Link, useLoaderData, useSearchParams } from 'react-router';
// Components
import PokemonCard from '../../components/PokemonCard/PokemonCard';
// API
import { getFavorites } from '../../api/favorites';
import { getPokedex } from '../../api/pokeapi';
// Data
import { TYPES } from '../../data/types';
// Styles
import styles from './Home.module.css';

const PAGE_SIZE = 24;

export async function loader({ url, favorites }) {
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const type = url.searchParams.get('type');
    const results = (await getPokedex()).filter((p) => (!favorites || favorites.has(p.id)) &&
        (!type || p.types.includes(type)) && (!q || p.name.includes(q) || Number(q) === p.id));
    const pages = Math.ceil(results.length / PAGE_SIZE) || 1;
    const page = Math.min(Math.max(parseInt(url.searchParams.get('page'), 10) || 1, 1), pages);
    return { favorites: Boolean(favorites), page, pages, total: results.length, pokemon: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

// /favoritos is the same list with its filters, limited to the ids saved in this browser
export const favoritesLoader = (args) => loader({ ...args, favorites: new Set(getFavorites()) });

export default function Home() {
    const { favorites, page, pages, total, pokemon } = useLoaderData();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type');

    // Current URL with one param changed; changing a filter goes back to the first page
    function urlWith(key, value) {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        if (key !== 'page') params.delete('page');
        return `?${params}`;
    }

    return (
        <>
            {favorites && <title>Favoritos | Pokédex</title>}
            <div className={styles.hero}>
                <h1 className={styles.title} tabIndex={-1}>{favorites ? 'Favoritos' : 'Pokédex Nacional'}</h1>
                <p className={styles.total} aria-live="polite">{total} Pokémon</p>

                <nav className={styles.filters} aria-label="Filtrar por tipo">
                    <Link to={urlWith('type', null)} aria-current={!type} className={styles.chip}>Todos</Link>
                    {Object.entries(TYPES).map(([key, { label, color }]) => (
                        <Link key={key} to={urlWith('type', key)} aria-current={key === type} className={styles.chip} style={{ '--type-color': color }}>
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>

            {pokemon.length > 0 ? (
                <ul className={styles.grid}>
                    {pokemon.map((p) => (
                        <li key={p.id}><PokemonCard pokemon={p} /></li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>
                    {favorites ? 'Aún no hay favoritos aquí. Márcalos con el corazón en la ficha de cada Pokémon.' : 'Ningún Pokémon coincide con la búsqueda.'}
                </p>
            )}

            {/* Empty spans keep "Página X de Y" centered on the first and last pages */}
            {pages > 1 && (
                <nav className={styles.pagination} aria-label="Paginación">
                    {page > 1 ? <Link to={urlWith('page', page - 1)}>Anterior</Link> : <span />}
                    <span>Página {page} de {pages}</span>
                    {page < pages ? <Link to={urlWith('page', page + 1)}>Siguiente</Link> : <span />}
                </nav>
            )}
        </>
    );
}