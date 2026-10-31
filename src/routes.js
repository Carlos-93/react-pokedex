// Components
import Layout from './components/Layout/Layout';
import Loading from './components/Loading/Loading';
// Pages
import ErrorPage from './pages/ErrorPage/ErrorPage';
import Home, { loader as homeLoader } from './pages/Home/Home';
import PokemonDetail, { loader as pokemonLoader } from './pages/PokemonDetail/PokemonDetail';

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
          { path: 'pokemon/:name', Component: PokemonDetail, loader: pokemonLoader },
          { path: '*', Component: ErrorPage },
        ],
      },
    ],
  },
];
