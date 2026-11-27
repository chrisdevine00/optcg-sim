/**
 * Game setup (flows F3a): your deck, the opponent (Warlord, Emperor, Pirate or Rookie AI, or a second player at this device),
 * who chooses first, and game options. Every choice has a default, so Start is one click away.
 * URL parameters prefill it for tests and shared links: `?p1=OP17-039&p2=OP17-058&opp=hotseat
 * &first=me&seed=42&speed=4&skip=1&scenario=defend&start=1`.
 */
import { useEffect, useState } from 'react';
import type { Card } from '@optcg/cards';
import type { Speed } from '../game/controller.ts';
import { Link } from '../../router.tsx';
import {
  ARCHETYPES,
  automationLine,
  deckById,
  deckFormat,
  DECKS,
  deckByLeader,
  loadCardsReport,
  SAVED,
  savedOptions,
  TUTORIAL,
  TUTORIAL_DECKS,
} from './decks.ts';
import { TUTORIAL_DECK_IDS } from '../../tutorial/decks.ts';
import { SCENARIOS } from './scenarios.ts';
import { checkSetupDeck, unavailableText } from './check.ts';
import { useAiWarmUp } from './useAiWarmUp.ts';

/**
 * Turn-time copy (review M5a-21). It must match docs/benchmarks.md "Pacing"; `app/test/setup-copy.test.ts`
 * fails when the two drift apart.
 */
export const TURN_TIME_PIRATE = 'typically 1–8 s a turn at 1×, up to about 10 s for a long one';
export const TURN_TIME_WARLORD = 'typically 4–8 s a turn at 1×, up to about 11 s for a long one';
export const TURN_TIME_EMPEROR = 'typically 10–15 s a turn at 1×, up to about 17 s for a long one';
export const TURN_TIME_ROOKIE = 'typically 1–8 s a turn at 1×, up to about 12 s for a long one';

/** The opponent: an AI tier, or a second player at this device. */
export type Opponent = 'warlord' | 'emperor' | 'pirate' | 'rookie' | 'hotseat';

export interface SetupChoice {
  myDeck: string;
  theirDeck: string;
  opponent: Opponent;
  first: 'roll' | 'me' | 'opp';
  names: [string, string];
  autoSkip: boolean;
  alwaysSkip: boolean;
  speed: Speed;
  seed: number | undefined;
  scenario?: string;
  /**
   * The first full game after the tutorial (M7 WP6, flows F2 step 6): the tutorial decks, Rookie,
   * Learner verbosity and the tier-1 lethal detector always on, for this one game only.
   */
  firstGame?: boolean;
  paused?: boolean;
  /** Tests: `iterations` makes the AI's search the same on every machine (`?aibudget=`). */
  aiBudgets?: 'iterations' | 'ms';
}

function fromUrl(): Partial<SetupChoice> & { start?: boolean } {
  const q = new URLSearchParams(window.location.search);
  const out: Partial<SetupChoice> & { start?: boolean } = {};
  const p1 = q.get('p1');
  const p2 = q.get('p2');
  if (p1) out.myDeck = (deckById(p1) ?? deckByLeader(p1))?.id;
  if (p2) out.theirDeck = (deckById(p2) ?? deckByLeader(p2))?.id;
  const opp = q.get('opp');
  if (
    opp === 'hotseat' ||
    opp === 'rookie' ||
    opp === 'pirate' ||
    opp === 'warlord' ||
    opp === 'emperor'
  )
    out.opponent = opp;
  const first = q.get('first');
  if (first === 'me' || first === 'opp' || first === 'roll') out.first = first;
  const seed = q.get('seed');
  if (seed && /^\d+$/.test(seed)) out.seed = Number(seed);
  const speed = q.get('speed');
  if (speed === 'step') out.speed = 'step';
  else if (speed && ['0.5', '1', '2', '4'].includes(speed)) out.speed = Number(speed) as Speed;
  if (q.get('skip') === '1') out.alwaysSkip = true;
  if (q.get('ask') === '1') out.autoSkip = false;
  if (q.get('paused') === '1') out.paused = true;
  const budget = q.get('aibudget');
  if (budget === 'iterations' || budget === 'ms') out.aiBudgets = budget;
  const sc = q.get('scenario');
  // A named scenario, or `json:<base64url>` with a described position (tests, shared positions).
  if (sc && (SCENARIOS[sc] || sc.startsWith('json:'))) out.scenario = sc;
  if (q.get('start') === '1') out.start = true;
  // The first-game preset (flows F2 step 6): the tutorial decks against Rookie, named on screen.
  if (q.get('preset') === 'first') {
    out.myDeck = TUTORIAL_DECK_IDS.mine;
    out.theirDeck = TUTORIAL_DECK_IDS.theirs;
    out.opponent = 'rookie';
    out.firstGame = true;
  }
  return out;
}

const COLOR_WORD: Record<string, string> = {};

export function Setup({
  onStart,
  loading,
  error,
}: {
  onStart: (c: SetupChoice) => void;
  loading: boolean;
  error: string | null;
}) {
  const [url] = useState(fromUrl);
  const [myDeck, setMyDeck] = useState(url.myDeck ?? DECKS[0]!.id);
  const [theirDeck, setTheirDeck] = useState(
    url.theirDeck ?? DECKS.find((d) => d.leader === 'OP17-058')?.id ?? DECKS[3]!.id,
  );
  const [opponent, setOpponent] = useState<Opponent>(url.opponent ?? 'warlord');
  const [first, setFirst] = useState<'roll' | 'me' | 'opp'>(url.first ?? 'roll');
  const [names, setNames] = useState<[string, string]>(['Player 1', 'Player 2']);
  const [autoSkip, setAutoSkip] = useState(url.autoSkip ?? true);
  const [alwaysSkip, setAlwaysSkip] = useState(url.alwaysSkip ?? false);
  const [seed, setSeed] = useState(url.seed !== undefined ? String(url.seed) : '');
  const speed = url.speed ?? 1;
  // The first-game coach defaults stay for this game whatever the player changes here.
  const firstGame = url.firstGame === true;

  // Card data for the two chosen decks, so the automation copy can tell cards with no effect from
  // cards whose effect is not scripted. The line appears once the sets have loaded.
  const [deckCards, setDeckCards] = useState<ReadonlyMap<string, Card>>(new Map());
  /** The pair of decks whose cards are loaded (Start waits for it; review M6-4). */
  const [readyFor, setReadyFor] = useState('');
  /** Cards whose set could not be fetched: "Card unavailable" with a retry, never "Unknown card" (review N-4). */
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(new Set());
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const ids = [myDeck, theirDeck].flatMap((id) => {
      const d = deckById(id);
      return d ? [d.spec.leader, ...d.spec.main] : [];
    });
    loadCardsReport(ids).then(
      (r) => {
        if (!live) return;
        setDeckCards(r.cards);
        setUnavailable(r.unavailable);
        setReadyFor(`${myDeck}|${theirDeck}`);
      },
      () => {
        if (!live) return;
        setUnavailable(new Set(ids));
        setReadyFor(`${myDeck}|${theirDeck}`);
      },
    );
    return () => {
      live = false;
    };
  }, [myDeck, theirDeck, attempt]);

  // One validation source with the builder and game start (flows F3a step 2, F17 step 7). Once the
  // cards are loaded, a card the data does not know is "Unknown card" here too (review M6-4).
  const cardsReady = readyFor === `${myDeck}|${theirDeck}`;
  const checks = (['mine', 'theirs'] as const).map((seat) => {
    const id = seat === 'mine' ? myDeck : theirDeck;
    const d = deckById(id);
    if (!d)
      return {
        seat,
        unavailable: [],
        problems: ['This deck was not found (deleted in another tab?).'],
      };
    if (!cardsReady) return { seat, unavailable: [], problems: [] };
    return { seat, ...checkSetupDeck(d.spec, deckCards, unavailable, deckFormat(id)) };
  });
  const problems = checks.flatMap((c) => c.problems.map((text) => ({ seat: c.seat, text })));
  const cantLoad = checks.some((c) => c.unavailable.length > 0);

  // The AI's worker is warmed now, not at Start (M10 WP3): it takes a moment to build its session.
  useAiWarmUp({
    opponent,
    myDeck,
    theirDeck,
    cards: deckCards,
    ready: cardsReady && problems.length === 0 && !cantLoad,
    off: !!url.scenario || !!url.start,
    ...(url.aiBudgets ? { budgets: url.aiBudgets } : {}),
  });

  const choice = (): SetupChoice => ({
    myDeck,
    theirDeck,
    opponent,
    first,
    names,
    autoSkip,
    alwaysSkip,
    speed,
    seed: /^\d+$/.test(seed) ? Number(seed) : undefined,
    ...(url.scenario ? { scenario: url.scenario } : {}),
    ...(firstGame ? { firstGame: true } : {}),
    ...(url.paused ? { paused: true } : {}),
    ...(url.aiBudgets ? { aiBudgets: url.aiBudgets } : {}),
  });

  useEffect(() => {
    if (url.start) onStart(choice());
    // Autostart once, from the URL only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hot = opponent === 'hotseat';
  return (
    <main className="page setup" id="main">
      <h1>New game</h1>
      {firstGame && (
        <p className="notice" role="note" data-testid="first-game-note">
          <b>Your first full game.</b> Set for your first game: the tutorial decks, the Rookie AI,
          the coach explaining in full (Learner) and the lethal detector always on. Change in
          Settings later.
        </p>
      )}
      <p className="lede">
        Pick two decks (the twelve meta decks, or your own from Decks), an opponent and who goes
        first.
      </p>
      <ul className="lede automation" data-testid="automation">
        {[myDeck, theirDeck].map((id, i) => {
          const d = deckById(id);
          const seat = hot ? `${names[i]}’s deck` : i === 0 ? 'Your deck' : 'The AI’s deck';
          // Beside an invalid deck the line would read as approval: the deck's own problems stand alone (review N-4).
          const clean = checks[i]!.problems.length === 0 && checks[i]!.unavailable.length === 0;
          return clean && d && [d.spec.leader, ...d.spec.main].every((c) => deckCards.has(c)) ? (
            <li key={i}>{automationLine(d, seat, deckCards)}</li>
          ) : null;
        })}
      </ul>
      <form
        className="setup-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(choice());
        }}
      >
        <DeckPicker
          legend={hot ? `${names[0]}’s deck` : 'Your deck'}
          name="mine"
          value={myDeck}
          onChange={setMyDeck}
          problems={problems.filter((p) => p.seat === 'mine').map((p) => p.text)}
          unavailable={checks[0]!.unavailable}
          onRetry={() => setAttempt((n) => n + 1)}
        />
        <fieldset className="setup-col">
          <legend>Opponent</legend>
          <div className="radio-list">
            <label className="check">
              <input
                type="radio"
                name="opp"
                checked={opponent === 'warlord'}
                onChange={() => setOpponent('warlord')}
              />
              <span>
                <b>Warlord AI</b>{' '}
                <span className="subtle">
                  · plans each turn by trying thousands of lines against hands it guesses from your
                  deck’s usual lists (it never sees your hidden cards), and explains each move ·{' '}
                  {TURN_TIME_WARLORD}
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="radio"
                name="opp"
                checked={opponent === 'emperor'}
                onChange={() => setOpponent('emperor')}
              />
              <span>
                <b>Emperor AI</b>{' '}
                <span className="subtle">
                  · the Warlord’s search with more than twice the thinking time; not measured to
                  play stronger · {TURN_TIME_EMPEROR}
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="radio"
                name="opp"
                checked={opponent === 'pirate'}
                onChange={() => setOpponent('pirate')}
              />
              <span>
                <b>Pirate AI</b>{' '}
                <span className="subtle">
                  · plays its deck’s game plan one turn at a time, and explains each move ·{' '}
                  {TURN_TIME_PIRATE}
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="radio"
                name="opp"
                checked={opponent === 'rookie'}
                onChange={() => setOpponent('rookie')}
              />
              <span>
                <b>Rookie AI</b>{' '}
                <span className="subtle">
                  · plays random legal moves, but always defends a lethal attack ·{' '}
                  {TURN_TIME_ROOKIE}
                </span>
              </span>
            </label>
            <label className="check">
              <input
                type="radio"
                name="opp"
                checked={opponent === 'hotseat'}
                onChange={() => setOpponent('hotseat')}
              />
              <span>
                <b>Second player at this device</b>{' '}
                <span className="subtle">· hotseat, with a handoff screen between turns</span>
              </span>
            </label>
          </div>
          {hot && (
            <div className="names">
              <label className="field">
                <span>Player 1 name</span>
                <input
                  className="input"
                  value={names[0]}
                  maxLength={20}
                  onChange={(e) => setNames([e.target.value, names[1]])}
                />
              </label>
              <label className="field">
                <span>Player 2 name</span>
                <input
                  className="input"
                  value={names[1]}
                  maxLength={20}
                  onChange={(e) => setNames([names[0], e.target.value])}
                />
              </label>
            </div>
          )}
          <DeckPicker
            legend={hot ? `${names[1]}’s deck` : 'Opponent’s deck'}
            name="theirs"
            value={theirDeck}
            onChange={setTheirDeck}
            problems={problems.filter((p) => p.seat === 'theirs').map((p) => p.text)}
            unavailable={checks[1]!.unavailable}
            onRetry={() => setAttempt((n) => n + 1)}
            compact
          />
        </fieldset>
        <fieldset className="setup-col">
          <legend>Game</legend>
          <div className="radio-list" role="radiogroup" aria-label="Who chooses first or second">
            <p className="field-label">Who chooses first or second</p>
            {(
              [
                ['roll', 'Roll for it', 'the seeded roll decides who chooses'],
                ['me', hot ? `${names[0]} chooses` : 'I choose', ''],
                ['opp', hot ? `${names[1]} chooses` : 'The AI chooses', ''],
              ] as const
            ).map(([v, label, sub]) => (
              <label key={v} className="check">
                <input
                  type="radio"
                  name="first"
                  checked={first === v}
                  onChange={() => setFirst(v)}
                />
                <span>
                  {label} {sub && <span className="subtle">· {sub}</span>}
                </span>
              </label>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={autoSkip}
              onChange={(e) => setAutoSkip(e.target.checked)}
            />
            <span>
              Skip empty windows <span className="subtle">· off means “always ask me”</span>
            </span>
          </label>
          {!hot && (
            <label className="check">
              <input
                type="checkbox"
                checked={alwaysSkip}
                onChange={(e) => setAlwaysSkip(e.target.checked)}
              />
              <span>
                Always skip to my decisions{' '}
                <span className="subtle">· still stops at every choice you owe</span>
              </span>
            </label>
          )}
          <label className="field">
            <span>Seed (optional, for a repeatable game)</span>
            <input
              className="input"
              inputMode="numeric"
              value={seed}
              onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          {problems.length > 0 && (
            <p className="notice warning-notice" role="alert" data-testid="deck-problems">
              Start is off until{' '}
              {problems.some((p) => p.seat === 'mine') && problems.some((p) => p.seat === 'theirs')
                ? 'both decks are fixed'
                : 'the deck is fixed'}
              : {problems.length} problem{problems.length === 1 ? '' : 's'}, listed under the deck.
            </p>
          )}
          {cantLoad && problems.length === 0 && (
            <p className="notice warning-notice" role="alert" data-testid="cards-unavailable">
              Start is off until the card data loads: use Retry under the deck.
            </p>
          )}
          {error && (
            <p className="notice warning-notice" role="alert">
              Couldn’t start the game: {error}
            </p>
          )}
          <button
            type="submit"
            className="btn primary big start"
            aria-busy={loading}
            disabled={loading || !cardsReady || problems.length > 0 || cantLoad}
          >
            {loading || !cardsReady ? 'Loading cards…' : 'Start game'}
          </button>
        </fieldset>
      </form>
    </main>
  );
}

function DeckPicker({
  legend,
  name,
  value,
  onChange,
  problems,
  unavailable = [],
  onRetry,
  compact = false,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (id: string) => void;
  /** This deck's check failures, shown under the picker (review M6-8). */
  problems: string[];
  /** Cards whose data could not be loaded (a network failure), with a retry. */
  unavailable?: string[];
  onRetry?: () => void;
  compact?: boolean;
}) {
  const saved = savedOptions();
  const current = deckById(value) ?? DECKS[0]!;
  const inGroup =
    current.archetype === SAVED
      ? saved
      : current.archetype === TUTORIAL
        ? TUTORIAL_DECKS
        : DECKS.filter((d) => d.archetype === current.archetype);
  return (
    <fieldset className={`setup-col deck-picker ${compact ? 'compact' : ''}`}>
      <legend>{legend}</legend>
      <label className="field">
        <span>Archetype</span>
        <select
          className="input"
          value={current.archetype}
          onChange={(e) =>
            onChange(
              e.target.value === SAVED
                ? saved[0]!.id
                : e.target.value === TUTORIAL
                  ? TUTORIAL_DECKS[name === 'theirs' ? 1 : 0]!.id
                  : DECKS.find((d) => d.archetype === e.target.value)!.id,
            )
          }
          name={`${name}-archetype`}
        >
          {saved.length > 0 && <option value={SAVED}>Your decks ({saved.length})</option>}
          <option value={TUTORIAL}>Tutorial decks (Starter Decks ST-21 and ST-22)</option>
          {ARCHETYPES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.leaderId}) · {a.colors.map((c) => COLOR_WORD[c] ?? c).join('/')}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>List</span>
        <select
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          name={`${name}-list`}
        >
          {inGroup.map((d, i) => (
            <option key={d.id} value={d.id}>
              {d.archetype === SAVED || d.archetype === TUTORIAL
                ? `${d.name} · ${d.leader}`
                : `List ${i + 1}: ${d.source}`}
            </option>
          ))}
        </select>
      </label>
      <p className="subtle small">
        {current.spec.main.length} cards · {current.name} ·{' '}
        {current.archetype === SAVED ? (
          <Link to={`/decks/${current.id.replace(/^saved:/, '')}`}>edit in the deck builder</Link>
        ) : current.archetype === TUTORIAL ? (
          <span>the counts are approximate: the product list is not checked yet</span>
        ) : (
          <a href={current.url} target="_blank" rel="noreferrer">
            source decklist
          </a>
        )}
      </p>
      {unavailable.length > 0 && (
        <div className="deck-problems" data-testid={`deck-unavailable-${name}`}>
          <p>The card data for this deck did not load.</p>
          <ul>
            {unavailableText(unavailable).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <button type="button" className="btn small" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
      {problems.length > 0 && (
        <div className="deck-problems" data-testid={`deck-problems-${name}`}>
          <p>
            {problems.length} problem{problems.length === 1 ? '' : 's'}: fix{' '}
            {problems.length === 1 ? 'it' : 'them'} in the deck builder.
          </p>
          <ul>
            {problems.slice(0, 5).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            {problems.length > 5 && <li>and {problems.length - 5} more</li>}
          </ul>
        </div>
      )}
    </fieldset>
  );
}
