/**
 * `/reviews` (History) and `/reviews/:id` (a saved game's review, M8 WP6). A saved game is read from
 * the store with its card data loaded by id, then handed to `ReviewScreen`, which needs nothing from
 * the live game that made it. `/reviews/:id` is a full-screen route (it can open the board); History
 * is an ordinary page inside the app shell.
 */
import { useEffect, useState } from 'react';
import type { Card } from '@optcg/cards';
import { Footer } from '../../Footer.tsx';
import { Header } from '../../Header.tsx';
import { History } from '../../history/History.tsx';
import { Link, navigate } from '../../router.tsx';
import { getStore, type StoredGame } from '../../store/index.ts';
import { settleStore } from '../../store/open.ts';
import { loadCards } from '../setup/decks.ts';
import { ReviewScreen } from './ReviewFlow.tsx';
import { cardIdsOf } from './restore.ts';

type Loaded =
  | { state: 'loading' }
  | { state: 'missing' }
  | { state: 'error'; message: string }
  | { state: 'ready'; game: StoredGame; cards: Map<string, Card> };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function Saved({ id }: { id: string }) {
  const [s, setS] = useState<Loaded>({ state: 'loading' });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await settleStore();
        const game = await getStore().getGame(id);
        if (!alive) return;
        if (!game) return setS({ state: 'missing' });
        const cards = await loadCards(cardIdsOf(game.record));
        if (alive) setS({ state: 'ready', game, cards });
      } catch (e) {
        if (alive) setS({ state: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);
  useEffect(() => {
    document.title = 'Game review · OPTCG Sim';
  }, []);

  if (s.state === 'ready')
    return (
      <ReviewScreen
        gameId={s.game.id}
        record={s.game.record}
        meta={s.game.meta}
        cards={s.cards}
        backLabel="All reviews"
        onBack={() => navigate('/reviews')}
        onHome={() => navigate('/')}
      />
    );
  return (
    <Shell>
      <main className="page" id="main" aria-busy={s.state === 'loading'}>
        <h1>Review</h1>
        {s.state === 'loading' && <p>Opening the review…</p>}
        {s.state === 'missing' && (
          <p>
            This game is not saved on this device. It may have been deleted.{' '}
            <Link to="/reviews">Back to your reviews</Link>
          </p>
        )}
        {s.state === 'error' && (
          <p>
            The game could not be opened: {s.message}. Nothing was changed.{' '}
            <Link to="/reviews">Back to your reviews</Link>
          </p>
        )}
      </main>
    </Shell>
  );
}

export default function ReviewsRoute({ path }: { path: string }) {
  if (path.startsWith('/reviews/'))
    return <Saved key={path} id={decodeURIComponent(path.slice('/reviews/'.length))} />;
  return <History />;
}
