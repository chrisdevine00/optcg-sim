import { manifest } from '@optcg/cards/browser';
import { Link } from '../router.tsx';

export function Home() {
  return (
    <main className="page" id="main">
      <h1>OPTCG Sim</h1>
      <p className="lede">
        A One Piece Card Game practice simulator and strategy teacher. Play a full game against the
        Pirate or Rookie AI, or a friend at the same device, or browse every English card.
      </p>
      <p className="home-actions">
        <Link to="/play" className="btn primary">
          Play a game
        </Link>{' '}
        <Link to="/cards" className="btn">
          Browse {manifest.cardCount.toLocaleString('en-US')} cards
        </Link>
      </p>
      <p className="muted small">
        Card data from optcgapi.com, through {manifest.newestSet}; {manifest.verifiedCount} cards
        verified by hand.
      </p>
    </main>
  );
}
