import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <span>Carlos Araujo Galván &copy; {new Date().getFullYear()}</span>
        </footer>
    );
}