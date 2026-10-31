import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
// Styles
import styles from './ErrorPage.module.css';

// Used both as the route ErrorBoundary and as the catch-all route, where there is no error
export default function ErrorPage() {
    const error = useRouteError();
    const notFound = !error || (isRouteErrorResponse(error) && error.status === 404);

    return (
        <section className={styles.error}>
            <h1 tabIndex={-1}>{notFound ? 'No encontrado' : 'Algo ha fallado'}</h1>
            <p>{notFound ? 'Ese Pokémon o página no existe.' : 'No se pudo conectar con PokeAPI. Inténtalo de nuevo.'}</p>
            <Link to="/" className={styles.link}>Volver al inicio</Link>
        </section>
    );
}