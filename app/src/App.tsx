import { lazy, Suspense, type LazyExoticComponent, type ReactNode } from 'react';
import { Header } from './Header.tsx';
import { Footer } from './Footer.tsx';
import { usePath } from './router.tsx';
import { Home } from './routes/Home.tsx';
import { m9Route, type M9Page } from './routes/m9.ts';
import { ErrorBoundary } from './shell/ErrorBoundary.tsx';
import { NotFound } from './shell/NotFound.tsx';
import { RouteFocus } from './shell/RouteFocus.tsx';
import { StorageNotice } from './store/StorageNotice.tsx';
import { StoreGate } from './store/StoreGate.tsx';
import { useStoreStatus } from './store/open.ts';
import { UpdatePrompt } from './update/UpdatePrompt.tsx';

const CardBrowser = lazy(() => import('./cards/CardBrowser.tsx'));
const PlayRoute = lazy(() => import('./play/PlayRoute.tsx'));
const DecksRoute = lazy(() => import('./decks/DecksRoute.tsx'));
const TutorialRoute = lazy(() => import('./tutorial/TutorialRoute.tsx'));
const SettingsRoute = lazy(() => import('./settings/SettingsRoute.tsx'));
const ReviewsRoute = lazy(() => import('./play/review/ReviewsRoute.tsx'));
const LessonRoute = lazy(() => import('./learn/LessonRoute.tsx'));
const AboutRoute = lazy(() => import('./about/AboutRoute.tsx'));

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

/** M9 pages that read or write the saved-data store: they sit under `StoreGate` (M10 WP1 fills it). */
const GATED_M9: ReadonlySet<M9Page> = new Set(['drills', 'drill-start', 'drill-run', 'progress']);

const Fallback = () => <main className="page" id="main" aria-busy="true" />;

export function App() {
  const path = usePath();
  return (
    <ErrorBoundary scope="shell">
      <Routes path={path} />
      <StorageNotice
        onBoard={path === '/play' || path === '/tutorial' || m9Route(path)?.full === true}
      />
    </ErrorBoundary>
  );
}

/** One route: its error boundary (a failing page leaves the header and footer up), its store gate if it needs saved data, and the lazy chunk's Suspense. */
function Guard({
  name,
  path,
  gated = false,
  children,
}: {
  name: string;
  path: string;
  gated?: boolean;
  children: ReactNode;
}) {
  // A database that opened after the 3 s cap and was taken re-keys the gated page so it reads the real store (M10-R5).
  const { epoch } = useStoreStatus();
  // The gate is outside the Suspense: its heading shows while the store opens and the chunk loads.
  const page = (
    <Suspense fallback={<Fallback />}>
      {children}
      <RouteFocus path={path} />
    </Suspense>
  );
  return (
    <ErrorBoundary scope={name}>
      {gated ? (
        <StoreGate key={epoch} path={path}>
          {page}
        </StoreGate>
      ) : (
        page
      )}
    </ErrorBoundary>
  );
}

function Routes({ path }: { path: string }) {
  const m9 = m9Route(path);
  if (m9?.full) {
    // A drill's items and a rules demo are boards: full-screen like /play.
    const Page = M9_PAGES[m9.page];
    return (
      <Guard name={m9.page} path={path} gated={GATED_M9.has(m9.page)}>
        <Page key={path} path={path} />
      </Guard>
    );
  }
  if (path === '/play')
    // The board is full-screen: its rail notice is the footer equivalent (board.md §3.1, C15).
    return (
      <Guard name="play" path={path} gated>
        <PlayRoute />
      </Guard>
    );
  if (path.startsWith('/reviews/'))
    // A saved game's review can open the board (Study, Play from here): full-screen like /play.
    return (
      <Guard name="review" path={path} gated>
        <ReviewsRoute path={path} />
      </Guard>
    );
  if (path === '/tutorial')
    // The tutorial is the board with a step card: full-screen like a game (flows F2).
    return (
      <Guard name="tutorial" path={path} gated>
        <TutorialRoute />
      </Guard>
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
        <Guard name="cards" path={path}>
          <CardBrowser />
        </Guard>
      ) : path === '/decks' || path.startsWith('/decks/') ? (
        <Guard name="decks" path={path} gated>
          <DecksRoute />
        </Guard>
      ) : path === '/settings' ? (
        <Guard name="settings" path={path} gated>
          <SettingsRoute />
        </Guard>
      ) : path === '/about' ? (
        <Guard name="about" path={path}>
          <AboutRoute />
        </Guard>
      ) : path === '/reviews' ? (
        <Guard name="reviews" path={path} gated>
          <ReviewsRoute path={path} />
        </Guard>
      ) : m9 ? (
        <Guard name={m9.page} path={path} gated={GATED_M9.has(m9.page)}>
          {(() => {
            const Page = M9_PAGES[m9.page];
            return <Page key={path} path={path} />;
          })()}
        </Guard>
      ) : path.startsWith('/learn/') ? (
        <Guard name="lesson" path={path} gated>
          <LessonRoute path={path} />
        </Guard>
      ) : path === '/' ? (
        <Guard name="home" path={path}>
          <Home />
        </Guard>
      ) : (
        <>
          <NotFound />
          <RouteFocus path={path} />
        </>
      )}
      <Footer />
    </div>
  );
}
