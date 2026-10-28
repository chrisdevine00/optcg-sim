import { manifest } from '@optcg/cards/browser';
import { Link } from '../router.tsx';

export function Home() {
  return (
    <main className="page" id="main">
      <h1>OPTCG Sim</h1>
      <p className="lede">
        A One Piece Card Game practice simulator and strategy teacher. The game board arrives in
        later milestones; for now you can browse every English card.
      </p>
      <p>
        <Link to="/cards" className="btn primary">
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
