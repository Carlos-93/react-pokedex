import styles from './Search.module.css';

export default function Search({ onSearch }) {
    function handleSubmit(event) {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('pokemon').trim().toLowerCase();
        if (query) onSearch(query);
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <input type="text" name="pokemon" aria-label="Nombre o número del Pokémon" placeholder="Nombre o número del Pokémon" className={styles.input} />
            <button type="submit" className={styles.button}>Buscar</button>
        </form>
    );
}