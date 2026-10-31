import { useEffect } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import Footer from '../Footer/Footer';
import Search from '../Search/Search';
import styles from './Layout.module.css';

export default function Layout() {
    const navigation = useNavigation();
    const location = useLocation();

    // After client-side navigation, move focus to the new page heading so screen readers announce it
    useEffect(() => {
        if (location.key !== 'default') document.querySelector('main h1')?.focus({ preventScroll: true });
    }, [location.key]);

    return (
        <>
            <header className={styles.header}>
                <Link to="/" className={styles.logo}>Pokédex</Link>
                <Search />
            </header>
            <main className={styles.main} aria-busy={navigation.state === 'loading'}>
                <Outlet />
            </main>
            <Footer />
            <ScrollRestoration />
        </>
    );
}
