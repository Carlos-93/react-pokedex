// Pages
import PokemonDetail, { action as pokemonAction, loader as pokemonLoader } from './pages/PokemonDetail/PokemonDetail';
import Home, { favoritesLoader, loader as homeLoader } from './pages/Home/Home';
import ErrorPage from './pages/ErrorPage/ErrorPage';
// Components
import Loading from './components/Loading/Loading';
import Layout from './components/Layout/Layout';

export const routes = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        // Path-less route so loading and errors render inside the layout, keeping the header
        HydrateFallback: Loading,
        ErrorBoundary: ErrorPage,
        children: [
          { index: true, Component: Home, loader: homeLoader },
          { path: 'favoritos', Component: Home, loader: favoritesLoader },
          { path: 'pokemon/:name', Component: PokemonDetail, loader: pokemonLoader, action: pokemonAction },
          { path: '*', Component: ErrorPage },
        ],
      },
    ],
  },
];