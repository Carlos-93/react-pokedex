import { useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
// Styles
import styles from './Search.module.css';

export default function Search() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const q = searchParams.get('q') ?? '';
    // Local state so typing never waits for the navigation; the URL keeps the raw text
    const [query, setQuery] = useState(q);

    // Follow q when it changes without typing: back/forward, links, the logo
    useEffect(() => setQuery(q), [q]);

    function handleChange(event) {
        const { value } = event.target;
        setQuery(value);
        // window.location changes as soon as the router commits; useLocation/useSearchParams
        // can still be a render behind when typing fast, which would push extra history entries
        const params = new URLSearchParams(window.location.search);
        if (value) params.set('q', value);
        else params.delete('q');
        params.delete('page');
        // On the list each key replaces the history entry; from other pages it is a new one
        navigate(`/?${params}`, { replace: window.location.pathname === '/' });
    }

    return (
        <form role="search" onSubmit={(event) => event.preventDefault()} className={styles.form}>
            <input type="search" name="q" value={query} onChange={handleChange} aria-label="Buscar Pokémon por nombre o número" placeholder="Buscar por nombre o número" className={styles.input} />
        </form>
    );
}