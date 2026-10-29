/**
 * `/play`: game setup (flows F3a), then the board. Lazy-loaded so the engine, the AI client and the
 * board stay out of the initial bundle.
 */
import { useEffect, useRef, useState } from 'react';
import type { PlayerId } from '@optcg/engine';
import { Footer } from '../Footer.tsx';
import { Header } from '../Header.tsx';
import { navigate } from '../router.tsx';
import { GameController, type GameConfig, type Speed } from './game/controller.ts';
import { Game } from './game/Game.tsx';
import { Setup, type SetupChoice } from './setup/Setup.tsx';
import { deckById, loadCards } from './setup/decks.ts';
import { SCENARIOS, scenarioCardIds } from './setup/scenarios.ts';
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
    tier: 'rookie',
    autoSkip: choice.autoSkip,
    alwaysSkip: choice.alwaysSkip,
    speed: choice.speed,
    startPaused: choice.paused ?? false,
  };
  if (choice.scenario) {
    const sc = scenarioFrom(choice.scenario);
    const cards = await loadCards(scenarioCardIds(sc));
    const { mode, ...spec } = sc;
    config.mode = mode;
    config.aiCardIds = scenarioCardIds({ ...sc, p1: { leader: sc.p2.leader }, p2: sc.p2 });
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
  ]);
  if (config.mode === 'ai') config.names.p2 = cards.get(theirDeck.leader)?.name ?? 'Opponent';
  config.aiCardIds = [theirDeck.spec.leader, ...theirDeck.spec.main];
  const chooser: PlayerId | undefined =
    choice.first === 'me' ? 'p1' : choice.first === 'opp' ? 'p2' : undefined;
  return new GameController(
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
}

export default function PlayRoute() {
  const [ctl, setCtl] = useState<GameController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<SetupChoice | null>(null);

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
        c.start();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => () => ctl?.dispose(), [ctl]);

  useEffect(() => {
    document.title = ctl ? 'Game · OPTCG Sim' : 'New game · OPTCG Sim';
  }, [ctl]);

  if (ctl) {
    return (
      <Game
        key={ctl.session.seed + ':' + String(ctl.config.mode)}
        ctl={ctl}
        onHome={() => {
          ctl.dispose();
          setCtl(null);
          navigate('/');
        }}
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
