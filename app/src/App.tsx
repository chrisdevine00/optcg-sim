import { lazy, Suspense } from 'react';
import { Footer } from './Footer.tsx';
import { Header } from './Header.tsx';
import { usePath } from './router.tsx';
import { Home } from './routes/Home.tsx';

const CardBrowser = lazy(() => import('./cards/CardBrowser.tsx'));
const PlayRoute = lazy(() => import('./play/PlayRoute.tsx'));

export function App() {
  const path = usePath();
  if (path === '/play')
    // The board is full-screen: its rail notice is the footer equivalent (board.md §3.1, C15).
    return (
      <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
        <PlayRoute />
      </Suspense>
    );
  return (
    <div className="shell">
      {path === '/cards' ? (
        <a
          className="skip-link"
          href="#results"
          onClick={(e) => {
            // Lands on the grid's one tab stop, past the header and filters (WCAG 2.4.1).
            e.preventDefault();
            document.getElementById('results')?.focus();
          }}
        >
          Skip to results
        </a>
      ) : (
        <a className="skip-link" href="#main">
          Skip to content
        </a>
      )}
      <Header />
      {path === '/cards' ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <CardBrowser />
        </Suspense>
      ) : path === '/' ? (
        <Home />
      ) : (
        <main className="page" id="main">
          <h1>Page not found</h1>
          <p>There is nothing at this address.</p>
        </main>
      )}
      <Footer />
    </div>
  );
}
