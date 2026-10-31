import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { routes } from './routes';
import './index.css';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);