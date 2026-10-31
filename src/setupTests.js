import '@testing-library/jest-dom';

// jsdom has no scrolling; React Router's ScrollRestoration calls it on every navigation
window.scrollTo = () => { };