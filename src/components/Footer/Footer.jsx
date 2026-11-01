import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div>
                <p className={styles.brand}>Pokédex</p>
                <p>Carlos Araujo Galván &copy; {new Date().getFullYear()}</p>
            </div>
            {/* Every name, text and number on the site comes from PokeAPI */}
            <p>Datos de <a href="https://pokeapi.co/">PokeAPI</a></p>
        </footer>
    );
}