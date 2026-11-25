import { lazy, Suspense } from 'react';
import { Footer } from './Footer.tsx';
import { Header } from './Header.tsx';
import { usePath } from './router.tsx';
import { Home } from './routes/Home.tsx';
import { UpdatePrompt } from './update/UpdatePrompt.tsx';

const CardBrowser = lazy(() => import('./cards/CardBrowser.tsx'));
const PlayRoute = lazy(() => import('./play/PlayRoute.tsx'));
const DecksRoute = lazy(() => import('./decks/DecksRoute.tsx'));
const TutorialRoute = lazy(() => import('./tutorial/TutorialRoute.tsx'));

export function App() {
  const path = usePath();
  if (path === '/play')
    // The board is full-screen: its rail notice is the footer equivalent (board.md §3.1, C15).
    return (
      <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
        <PlayRoute />
      </Suspense>
    );
  if (path === '/tutorial')
    // The tutorial is the board with a step card: full-screen like a game (flows F2).
    return (
      <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
        <TutorialRoute />
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
      <UpdatePrompt />
      {path === '/cards' ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <CardBrowser />
        </Suspense>
      ) : path === '/decks' || path.startsWith('/decks/') ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <DecksRoute />
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
