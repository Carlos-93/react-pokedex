import { Link, useLoaderData, useSearchParams } from 'react-router';
import { useLayoutEffect, useRef } from 'react';
// Components
import PokemonCard from '../../components/PokemonCard/PokemonCard';
// API
import { getFavorites } from '../../api/favorites';
import { getPokedex } from '../../api/pokeapi';
// Data
import { TYPES } from '../../data/constants';
// Styles
import styles from './Home.module.css';

const PAGE_SIZE = 24;

// Always 7 slots, so the numbers keep their place from page to page: the first and last pages,
// the current one with its neighbors, and null where "…" stands for the pages left out
export function pageSlots(page, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, null, pages];
    if (page >= pages - 3) return [1, null, pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, null, page - 1, page, page + 1, null, pages];
}

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
    const pagination = useRef(null);
    const paginationTop = useRef(null);

    // After a click in the pagination, the new page keeps it at the same spot on screen,
    // also when it is taller or shorter than the old one (the last page has fewer cards)
    useLayoutEffect(() => {
        if (paginationTop.current === null) return;
        if (pagination.current) scrollBy(0, pagination.current.getBoundingClientRect().top - paginationTop.current);
        paginationTop.current = null;
    }, [pokemon]);

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

            {/* On the first and last pages the missing step stays as a faded placeholder, so nothing moves.
                Screen readers skip it and the "…", they only hear the links.
                preventScrollReset: changing page keeps the scroll down here by the pagination, instead of going back to the top */}
            {pages > 1 && (
                // defaultPrevented: the Link navigates here; a Ctrl+click that opens a new tab does not
                <nav ref={pagination} className={styles.pagination} aria-label="Paginación"
                    onClick={(e) => { if (e.defaultPrevented) paginationTop.current = pagination.current.getBoundingClientRect().top; }}>
                    {page > 1
                        ? <Link to={urlWith('page', page - 1)} preventScrollReset className={styles.prev}>Anterior</Link>
                        : <span className={styles.prev} aria-hidden="true">Anterior</span>}
                    <div className={styles.pages}>
                        {pageSlots(page, pages).map((n, i) => n ? (
                            <Link key={i} to={urlWith('page', n)} preventScrollReset aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined}>{n}</Link>
                        ) : (
                            <span key={i} aria-hidden="true">…</span>
                        ))}
                    </div>
                    {page < pages
                        ? <Link to={urlWith('page', page + 1)} preventScrollReset className={styles.next}>Siguiente</Link>
                        : <span className={styles.next} aria-hidden="true">Siguiente</span>}
                    <p className={styles.range}>Pokémon {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + pokemon.length} de {total}</p>
                </nav>
            )}
        </>
    );
}