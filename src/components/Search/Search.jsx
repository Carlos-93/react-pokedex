import { useNavigate } from 'react-router';
import styles from './Search.module.css';

export default function Search() {
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('pokemon').trim().toLowerCase();
        if (query) navigate(`/pokemon/${encodeURIComponent(query)}`);
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form} role="search">
            <input type="search" name="pokemon" aria-label="Nombre o número del Pokémon" placeholder="Nombre o número" className={styles.input} />
            <button type="submit" className={styles.button}>Buscar</button>
        </form>
    );
}
