/**
 * Game setup (flows F3a): your deck, the opponent (Pirate or Rookie AI, or a second player at this device),
 * who chooses first, and game options. Every choice has a default, so Start is one click away.
 * URL parameters prefill it for tests and shared links: `?p1=OP17-039&p2=OP17-058&opp=hotseat
 * &first=me&seed=42&speed=4&skip=1&scenario=defend&start=1`.
 */
import { useEffect, useState } from 'react';
import type { Speed } from '../game/controller.ts';
import { ARCHETYPES, automationLine, deckById, DECKS, deckByLeader } from './decks.ts';
import { SCENARIOS } from './scenarios.ts';

/** The opponent: an AI tier, or a second player at this device. */
export type Opponent = 'pirate' | 'rookie' | 'hotseat';

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
  paused?: boolean;
  /** Tests: `iterations` makes the AI's search the same on every machine (`?aibudget=`). */
  aiBudgets?: 'iterations' | 'ms';
}

function fromUrl(): Partial<SetupChoice> & { start?: boolean } {
  const q = new URLSearchParams(window.location.search);
  const out: Partial<SetupChoice> & { start?: boolean } = {};
  const p1 = q.get('p1');
  const p2 = q.get('p2');
  if (p1) out.myDeck = (DECKS.find((d) => d.id === p1) ?? deckByLeader(p1))?.id;
  if (p2) out.theirDeck = (DECKS.find((d) => d.id === p2) ?? deckByLeader(p2))?.id;
  const opp = q.get('opp');
  if (opp === 'hotseat' || opp === 'rookie' || opp === 'pirate') out.opponent = opp;
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
  const [opponent, setOpponent] = useState<Opponent>(url.opponent ?? 'pirate');
  const [first, setFirst] = useState<'roll' | 'me' | 'opp'>(url.first ?? 'roll');
  const [names, setNames] = useState<[string, string]>(['Player 1', 'Player 2']);
  const [autoSkip, setAutoSkip] = useState(url.autoSkip ?? true);
  const [alwaysSkip, setAlwaysSkip] = useState(url.alwaysSkip ?? false);
  const [seed, setSeed] = useState(url.seed !== undefined ? String(url.seed) : '');
  const speed = url.speed ?? 1;

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
      <p className="lede">Pick two of the twelve meta decks, an opponent and who goes first.</p>
      <ul className="lede automation" data-testid="automation">
        {[myDeck, theirDeck].map((id, i) => {
          const d = deckById(id);
          const seat = hot ? `${names[i]}’s deck` : i === 0 ? 'Your deck' : 'The AI’s deck';
          return d ? <li key={i}>{automationLine(d, seat)}</li> : null;
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
        />
        <fieldset className="setup-col">
          <legend>Opponent</legend>
          <div className="radio-list">
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
                  · plays its deck’s game plan one turn at a time, and explains each move · about
                  1–7 s a turn at 1×
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
                  · plays random legal moves, but always defends a lethal attack · about 1–5 s a
                  turn at 1×
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
          {error && (
            <p className="notice warning-notice" role="alert">
              Couldn’t start the game: {error}
            </p>
          )}
          <button
            type="submit"
            className="btn primary big start"
            aria-busy={loading}
            disabled={loading}
          >
            {loading ? 'Loading cards…' : 'Start game'}
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
  compact = false,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const current = DECKS.find((d) => d.id === value)!;
  return (
    <fieldset className={`setup-col deck-picker ${compact ? 'compact' : ''}`}>
      <legend>{legend}</legend>
      <label className="field">
        <span>Archetype</span>
        <select
          className="input"
          value={current.archetype}
          onChange={(e) => onChange(DECKS.find((d) => d.archetype === e.target.value)!.id)}
          name={`${name}-archetype`}
        >
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
          {DECKS.filter((d) => d.archetype === current.archetype).map((d, i) => (
            <option key={d.id} value={d.id}>
              List {i + 1}: {d.source}
            </option>
          ))}
        </select>
      </label>
      <p className="subtle small">
        50 cards · {current.name} ·{' '}
        <a href={current.url} target="_blank" rel="noreferrer">
          source decklist
        </a>
      </p>
    </fieldset>
  );
}
