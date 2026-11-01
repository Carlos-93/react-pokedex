import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import { useEffect } from 'react';
// Components
import Footer from '../Footer/Footer';
import Search from '../Search/Search';
// Styles
import styles from './Layout.module.css';

// Opposite of the theme on screen. Stored only while it differs from the system theme,
// so toggling back makes the site follow the system again. The new theme grows from the bottom right (see index.css)
function toggleTheme() {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = (meta.content === 'light dark' ? system : meta.content) === 'dark' ? 'light' : 'dark';
    try {
        if (theme === system) localStorage.removeItem('color-scheme');
        else localStorage.setItem('color-scheme', theme);
    } catch {
        // storage blocked: the theme still changes, only for this visit
    }
    const apply = () => { meta.content = theme === system ? 'light dark' : theme; };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
}

export default function Layout() {
    const navigation = useNavigation();
    const location = useLocation();

    // After client-side navigation, move focus to the new page heading so screen readers announce it
    // Not while typing in the search box, which navigates on every key
    useEffect(() => {
        if (location.key !== 'default' && document.activeElement?.tagName !== 'INPUT') {
            document.querySelector('main h1')?.focus({ preventScroll: true });
        }
    }, [location.key]);

    return (
        <>
            <header className={styles.header}>
                <Link to="/" className={styles.logo}>Pokédex</Link>
                <NavLink to="/favoritos" className={styles.favorites}>Favoritos</NavLink>
                <Search />
            </header>

            <main className={styles.main} aria-busy={navigation.state === 'loading'}>
                <Outlet />
            </main>

            <Footer />
            <button type="button" onClick={toggleTheme} aria-label="Cambiar entre tema claro y oscuro" className={styles.theme} />
            <ScrollRestoration />
        </>
    );
}