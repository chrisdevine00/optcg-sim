/**
 * `/play`: game setup (flows F3a), then the board. Lazy-loaded so the engine, the AI client and the
 * board stay out of the initial bundle.
 */
import { useEffect, useRef, useState } from 'react';
import type { PlayerId } from '@optcg/engine';
import type { SessionRecord } from '../session/index.ts';
import type { GameMeta } from '../store/types.ts';
import { Footer } from '../Footer.tsx';
import { Header } from '../Header.tsx';
import { navigate } from '../router.tsx';
import { GameController, type GameConfig, type Speed } from './game/controller.ts';
import { Game } from './game/Game.tsx';
import { ReviewScreen } from './review/ReviewFlow.tsx';
import { Setup, type SetupChoice } from './setup/Setup.tsx';
import { deckById, deckByLeader, loadCards } from './setup/decks.ts';
import { priorCardIds } from '@optcg/ai';
import { SCENARIOS, scenarioCardIds } from './setup/scenarios.ts';
import { applyFirstGame } from '../tutorial/preset.ts';
import { gameSaver, metaFrom, type SaveSource } from './save-game.ts';
import './play.css';

/** A named scenario, or one described in the URL as `json:<base64url of the spec>`. */
function scenarioFrom(name: string): (typeof SCENARIOS)[string] {
  if (!name.startsWith('json:')) {
    const named = SCENARIOS[name];
    if (!named) throw new Error(`There is no scenario named "${name}".`);
    return named;
  }
  let sc: unknown;
  try {
    const b64 = name.slice(5).replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    sc = JSON.parse(json);
  } catch {
    throw new Error('The scenario in the address could not be read.');
  }
  // Review M3-43: a spec without a valid mode used to hang on "Thinking"; refuse it up front.
  const o = sc as Partial<(typeof SCENARIOS)[string]> | null;
  if (!o || typeof o !== 'object') throw new Error('The scenario in the address is not an object.');
  if (o.mode !== 'ai' && o.mode !== 'hotseat')
    throw new Error('The scenario in the address needs "mode": "ai" or "hotseat".');
  if (!o.p1?.leader || !o.p2?.leader)
    throw new Error('The scenario in the address needs a Leader for each player.');
  return o as (typeof SCENARIOS)[string];
}

/** The save seam's view of a controller (M8 WP0). */
export function sourceOf(ctl: GameController, deckName?: string): SaveSource {
  const leaderOf = (p: PlayerId) => {
    const id = ctl.session.view(p).zones[p].leader[0]?.card;
    return (id && ctl.cards.get(id)?.name) || '';
  };
  return {
    mode: ctl.config.mode,
    me: ctl.me,
    tier: ctl.config.tier,
    result: ctl.session.view('p1').result,
    record: () => ctl.session.exportRecord(),
    leaderOf,
    ...(deckName ? { deckName } : {}),
    turn: () => ctl.session.view('p1').turn.number,
  };
}

function seedNow(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0]! % 2147483647;
}

async function startGame(choice: SetupChoice): Promise<GameController> {
  const names: Record<PlayerId, string> =
    choice.opponent === 'hotseat'
      ? { p1: choice.names[0] || 'Player 1', p2: choice.names[1] || 'Player 2' }
      : { p1: 'You', p2: '' };
  const config: GameConfig = {
    mode: choice.opponent === 'hotseat' ? 'hotseat' : 'ai',
    human: 'p1',
    names,
    tier: choice.opponent === 'hotseat' ? 'pirate' : choice.opponent,
    autoSkip: choice.autoSkip,
    alwaysSkip: choice.alwaysSkip,
    speed: choice.speed,
    startPaused: choice.paused ?? false,
    ...(choice.aiBudgets ? { aiBudgets: choice.aiBudgets } : {}),
  };
  if (choice.scenario) {
    const sc = scenarioFrom(choice.scenario);
    const { mode, ...spec } = sc;
    const p1Leader = typeof sc.p1.leader === 'string' ? sc.p1.leader : sc.p1.leader.card;
    const p2Leader = typeof sc.p2.leader === 'string' ? sc.p2.leader : sc.p2.leader.card;
    // The AI's own list (its decklist, or its archetype's first list), and the public prior for
    // the human's Leader (ARCHITECTURE §4.3).
    const aiDeck = sc.p2.decklist ?? deckByLeader(p2Leader)?.spec.main ?? [];
    // The player's own list, for the coach's hint (the player's own data, never the AI's worker).
    const myDeck = sc.p1.decklist ?? deckByLeader(p1Leader)?.spec.main ?? [];
    const cards = await loadCards([
      ...scenarioCardIds(sc),
      ...aiDeck,
      ...myDeck,
      ...priorCardIds(p1Leader),
      // The public prior for their Leader: the lethal detector’s biggest Counter (ARCHITECTURE §4.4).
      ...priorCardIds(p2Leader),
    ]);
    config.mode = mode;
    config.aiCardIds = [
      ...scenarioCardIds({ ...sc, p1: { leader: sc.p2.leader }, p2: sc.p2 }),
      ...aiDeck,
    ];
    config.aiDeck = aiDeck;
    config.myDeck = myDeck;
    if (mode === 'hotseat')
      config.names = { p1: choice.names[0] || 'Player 1', p2: choice.names[1] || 'Player 2' };
    else
      config.names.p2 =
        cards.get(typeof spec.p2.leader === 'string' ? spec.p2.leader : spec.p2.leader.card)
          ?.name ?? 'Opponent';
    return new GameController(cards, { scenario: spec }, config);
  }
  const mineDeck = deckById(choice.myDeck)!;
  const theirDeck = deckById(choice.theirDeck)!;
  const cards = await loadCards([
    mineDeck.spec.leader,
    ...mineDeck.spec.main,
    theirDeck.spec.leader,
    ...theirDeck.spec.main,
    // The AI's public prior for the human's Leader (ARCHITECTURE §4.3).
    ...priorCardIds(mineDeck.spec.leader),
    // And for theirs: the lethal detector's biggest Counter (ARCHITECTURE §4.4).
    ...priorCardIds(theirDeck.spec.leader),
  ]);
  if (config.mode === 'ai') config.names.p2 = cards.get(theirDeck.leader)?.name ?? 'Opponent';
  config.aiCardIds = [theirDeck.spec.leader, ...theirDeck.spec.main];
  config.aiDeck = theirDeck.spec.main;
  config.myDeck = mineDeck.spec.main;
  const chooser: PlayerId | undefined =
    choice.first === 'me' ? 'p1' : choice.first === 'opp' ? 'p2' : undefined;
  const ctl = new GameController(
    cards,
    {
      setup: {
        seed: choice.seed ?? seedNow(),
        decks: { p1: mineDeck.spec, p2: theirDeck.spec },
        ...(chooser ? { chooser } : {}),
      },
    },
    config,
  );
  // The first full game after the tutorial (flows F2 step 6): Learner verbosity and the tier-1
  // lethal detector always on, for this one game. They are set on the loaded profile in memory;
  // nothing is saved unless the player changes a coach setting (which saves the whole profile).
  if (choice.firstGame) ctl.coach.profile = applyFirstGame(ctl.coach.profile);
  return ctl;
}

export default function PlayRoute() {
  const [ctl, setCtl] = useState<GameController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<SetupChoice | null>(null);
  // The finished game is being reviewed (learning-ui §4): a copy of its record, taken once, is read
  // (M8 WP6), so the screen does not depend on the controller that played it.
  const [reviewing, setReviewing] = useState<{
    record: SessionRecord;
    meta: GameMeta;
    id: string | null;
  } | null>(null);
  const openReview = (c: GameController) => {
    const record = c.session.exportRecord();
    const src = sourceOf(c, last.current ? deckById(last.current.myDeck)?.name : undefined);
    setReviewing({
      record,
      meta: metaFrom(src, record, Date.now()),
      id: gameSaver.idOf(c) ?? null,
    });
  };

  const begin = (choice: SetupChoice) => {
    last.current = choice;
    setLoading(true);
    setError(null);
    startGame(choice)
      .then((c) => {
        setCtl((old) => {
          old?.dispose();
          return c;
        });
        setReviewing(null);
        c.start();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => () => ctl?.dispose(), [ctl]);

  // The save seam: a finished game against the AI is saved once (WP5 swaps the store for IndexedDB).
  useEffect(() => {
    if (!ctl) return;
    const save = () => {
      const deck = last.current ? deckById(last.current.myDeck)?.name : undefined;
      void gameSaver.observe(ctl, sourceOf(ctl, deck));
    };
    save();
    return ctl.subscribe(save);
  }, [ctl]);

  useEffect(() => {
    document.title = ctl ? 'Game · OPTCG Sim' : 'New game · OPTCG Sim';
  }, [ctl]);

  const goHome = () => {
    ctl?.dispose();
    setCtl(null);
    setReviewing(null);
    navigate('/');
  };
  if (ctl && reviewing) {
    return (
      <ReviewScreen
        gameId={reviewing.id}
        record={reviewing.record}
        meta={reviewing.meta}
        cards={ctl.cards}
        backLabel="Back to the board"
        onBack={() => setReviewing(null)}
        onHome={goHome}
      />
    );
  }
  if (ctl) {
    return (
      <Game
        key={ctl.session.seed + ':' + String(ctl.config.mode)}
        ctl={ctl}
        {...(ctl.config.mode === 'ai' ? { onReview: () => openReview(ctl) } : {})}
        onHome={goHome}
        onNewGame={() => {
          ctl.dispose();
          setCtl(null);
        }}
        onRematch={() => {
          // Same decks and opponent, a new seed; the loser of this game chooses first (flows F15).
          const r = ctl.view().result;
          const prev = last.current!;
          const loser: PlayerId | null =
            r && 'winner' in r ? (r.winner === 'p1' ? 'p2' : 'p1') : null;
          begin({
            ...prev,
            seed: undefined,
            first: loser === 'p1' ? 'me' : loser === 'p2' ? 'opp' : prev.first,
          });
        }}
      />
    );
  }
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <Setup onStart={begin} loading={loading} error={error} />
      <Footer />
    </div>
  );
}

export type { Speed };
