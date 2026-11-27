import { lazy, Suspense, type LazyExoticComponent, type ReactNode } from 'react';
import { Footer } from './Footer.tsx';
import { Header } from './Header.tsx';
import { usePath } from './router.tsx';
import { Home } from './routes/Home.tsx';
import { m9Route, type M9Page } from './routes/m9.ts';
import { StorageNotice } from './store/StorageNotice.tsx';
import { UpdatePrompt } from './update/UpdatePrompt.tsx';

const CardBrowser = lazy(() => import('./cards/CardBrowser.tsx'));
const PlayRoute = lazy(() => import('./play/PlayRoute.tsx'));
const DecksRoute = lazy(() => import('./decks/DecksRoute.tsx'));
const TutorialRoute = lazy(() => import('./tutorial/TutorialRoute.tsx'));
const SettingsRoute = lazy(() => import('./settings/SettingsRoute.tsx'));
const ReviewsRoute = lazy(() => import('./play/review/ReviewsRoute.tsx'));
const LessonRoute = lazy(() => import('./learn/LessonRoute.tsx'));

// M9: every new route is its own lazy chunk, so the initial bundle does not grow (WP0).
const M9_PAGES: Record<M9Page, LazyExoticComponent<(p: { path: string }) => ReactNode>> = {
  meta: lazy(() => import('./meta/MetaRoute.tsx')),
  'meta-matchups': lazy(() => import('./meta/MatchupGrid.tsx')),
  'meta-guide': lazy(() => import('./meta/GuideRoute.tsx')),
  learn: lazy(() => import('./learn/LearnRoute.tsx')),
  drills: lazy(() => import('./drills/DrillsHome.tsx')),
  'drill-start': lazy(() => import('./drills/DrillStart.tsx')),
  'drill-run': lazy(() => import('./drills/DrillRun.tsx')),
  rules: lazy(() => import('./rules/RulesRoute.tsx')),
  'rules-entry': lazy(() => import('./rules/RuleEntry.tsx')),
  'rules-show': lazy(() => import('./rules/ShowMe.tsx')),
  progress: lazy(() => import('./progress/ProgressRoute.tsx')),
};

const Fallback = () => <main className="page" id="main" aria-busy="true" />;

export function App() {
  const path = usePath();
  return (
    <>
      <Routes path={path} />
      <StorageNotice
        onBoard={path === '/play' || path === '/tutorial' || m9Route(path)?.full === true}
      />
    </>
  );
}

function Routes({ path }: { path: string }) {
  const m9 = m9Route(path);
  if (m9?.full) {
    // A drill's items and a rules demo are boards: full-screen like /play.
    const Page = M9_PAGES[m9.page];
    return (
      <Suspense fallback={<Fallback />}>
        <Page key={path} path={path} />
      </Suspense>
    );
  }
  if (path === '/play')
    // The board is full-screen: its rail notice is the footer equivalent (board.md §3.1, C15).
    return (
      <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
        <PlayRoute />
      </Suspense>
    );
  if (path.startsWith('/reviews/'))
    // A saved game's review can open the board (Study, Play from here): full-screen like /play.
    return (
      <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
        <ReviewsRoute path={path} />
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
      ) : path === '/settings' ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <SettingsRoute />
        </Suspense>
      ) : path === '/reviews' ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <ReviewsRoute path={path} />
        </Suspense>
      ) : m9 ? (
        <Suspense fallback={<Fallback />}>
          {(() => {
            const Page = M9_PAGES[m9.page];
            return <Page key={path} path={path} />;
          })()}
        </Suspense>
      ) : path.startsWith('/learn/') ? (
        <Suspense fallback={<main className="page" id="main" aria-busy="true" />}>
          <LessonRoute path={path} />
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
