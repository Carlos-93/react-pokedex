import { Link, useLoaderData } from 'react-router';
import { getPokedex } from '../../api/pokeapi';
import PokemonCard from '../../components/PokemonCard/PokemonCard';
import styles from './Home.module.css';

const PAGE_SIZE = 24;

export async function loader({ url }) {
    const pokedex = await getPokedex();
    const pages = Math.ceil(pokedex.length / PAGE_SIZE);
    const page = Math.min(Math.max(parseInt(url.searchParams.get('page'), 10) || 1, 1), pages);
    return { page, pages, total: pokedex.length, pokemon: pokedex.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

export default function Home() {
    const { page, pages, total, pokemon } = useLoaderData();

    return (
        <>
            <h1 className={styles.title} tabIndex={-1}>Pokédex Nacional</h1>
            <p className={styles.total}>{total} Pokémon</p>

            <ul className={styles.grid}>
                {pokemon.map((p) => (
                    <li key={p.id}><PokemonCard pokemon={p} /></li>
                ))}
            </ul>

            {/* Empty spans keep "Página X de Y" centered on the first and last pages */}
            <nav className={styles.pagination} aria-label="Paginación">
                {page > 1 ? <Link to={`?page=${page - 1}`}>Anterior</Link> : <span />}
                <span>Página {page} de {pages}</span>
                {page < pages ? <Link to={`?page=${page + 1}`}>Siguiente</Link> : <span />}
            </nav>
        </>
    );
}
