import { useState } from 'react';
import { manifest } from '@optcg/cards/browser';
import { Link, navigate } from '../router.tsx';
import {
  loadProgress,
  loadWelcome,
  saveWelcome,
  STEP_COUNT,
  type Welcome,
} from '../tutorial/progress.ts';

export function Home() {
  // The welcome question (flows F1): asked until it is answered; a finished tutorial ends it.
  const [welcome, setWelcome] = useState<Welcome | null>(loadWelcome);
  const progress = loadProgress();

  const answer = (w: Welcome, to: string) => {
    saveWelcome(w);
    setWelcome(w);
    navigate(to);
  };

  return (
    <main className="page" id="main">
      <h1>OPTCG Sim</h1>
      <p className="lede">
        A One Piece Card Game practice simulator and strategy teacher. Play a full game against the
        Warlord, Emperor, Pirate or Rookie AI, or a friend at the same device, or browse every
        English card.
      </p>
      {progress && (
        <p className="home-actions">
          <Link to="/tutorial" className="btn primary" data-testid="continue-tutorial">
            Continue the tutorial (step {progress.step + 1} of {STEP_COUNT})
          </Link>{' '}
          <Link to="/tutorial?restart=1" className="btn">
            Start the tutorial again
          </Link>
        </p>
      )}
      {welcome === null && !progress && (
        <section className="welcome" aria-labelledby="welcome-q" data-testid="welcome">
          <h2 id="welcome-q">Have you played One Piece Card Game before?</h2>
          <div className="choices">
            <button
              type="button"
              className="btn primary choice"
              onClick={() => answer('know-rules', '/play?opp=pirate')}
            >
              I know the rules: start a game
              <span className="sub">
                Rocks vs Kaido, Pirate AI. Change anything first if you like.
              </span>
            </button>
            <button
              type="button"
              className="btn choice"
              onClick={() => answer('new', '/tutorial?restart=1')}
            >
              I’m new: teach me
              <span className="sub">About 20 minutes. You can leave and come back.</span>
            </button>
          </div>
          <p>
            <Link to="/cards">Just look around</Link>
          </p>
        </section>
      )}
      <p className="home-actions">
        <Link to="/play" className="btn primary">
          Play a game
        </Link>{' '}
        <Link to="/cards" className="btn">
          Browse {manifest.cardCount.toLocaleString('en-US')} cards
        </Link>
        {welcome !== 'tutorial-done' && !progress && welcome !== null && (
          <>
            {' '}
            <Link to="/tutorial?restart=1" className="btn">
              Learn the game: the tutorial
            </Link>
          </>
        )}
      </p>
      <p className="muted small">
        Card data from optcgapi.com, through {manifest.newestSet}; {manifest.verifiedCount} cards
        verified by hand.
      </p>
    </main>
  );
}
