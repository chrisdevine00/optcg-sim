/**
 * Starting a game: from a seed and two decks (CR 5-2-1, rules-digest section F), or from a
 * described position (ADR 0013).
 */
import type {
  CardId,
  CardPlacement,
  DeckSpec,
  GameSetup,
  InstanceId,
  Phase,
  PlayerSpec,
  ScenarioSpec,
  Step,
} from './api.ts';
import { DECK_SIZE, DefTable, MAX_COPIES, donDeckSizeFor } from './defs.ts';
import { Draft } from './draft.ts';
import { advance, MAX_CHARACTERS } from './flow.ts';
import { checkInvariants } from './invariants.ts';
import { shuffleDeck } from './ops/index.ts';
import { nextInt, seedRng, shuffle } from './rng.ts';
import {
  other,
  PLAYERS,
  type CardInst,
  type Frame,
  type PlayerState,
  type State,
} from './state.ts';

export class InvalidSetup extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSetup';
  }
}

/** A second, independent stream for instance ids (see `State.idRng`). */
function idSeed(seed: number): number {
  return (Math.imul(seed >>> 0, 2654435761) ^ 0x5bd1e995) >>> 0;
}

function emptyPlayer(): PlayerState {
  return {
    deck: [],
    hand: [],
    life: [],
    leader: '',
    characters: [],
    stage: [],
    trash: [],
    donDeck: 0,
    donActive: 0,
    donRested: 0,
  };
}

function baseState(seed: number, defs: DefTable): State {
  return {
    v: 1,
    rng: seedRng(seed),
    idRng: idSeed(seed),
    turn: 0,
    active: 'p1',
    first: 'p1',
    phase: 'setup',
    defs: defs.defs,
    cards: {},
    players: { p1: emptyPlayer(), p2: emptyPlayer() },
    resolving: [],
    battle: null,
    stack: [],
    pending: [],
    decision: null,
    result: null,
    mods: [],
    nextMod: 1,
    oncePerTurn: [],
    setup: {
      chooser: 'p1',
      leader: { p1: '', p2: '' },
      deckSize: { p1: 0, p2: 0 },
      donSize: { p1: 0, p2: 0 },
      mulliganed: { p1: false, p2: false },
    },
    renames: [],
    known: { p1: [], p2: [] },
    delayed: [],
  };
}

function addCard(
  d: Draft,
  inst: Omit<CardInst, 'played' | 'key'> & { played?: number },
): InstanceId {
  const id = d.newId();
  d.s.cards[id] = { played: -1, key: d.newKey(), ...inst };
  return id;
}

// ---------------------------------------------------------------------------------------------
// Deck validation (CR 5-1-2)
// ---------------------------------------------------------------------------------------------

/** Problems with a deck under the CR deck-construction rules; empty when legal. */
export function validateDeck(deck: DeckSpec, defs: DefTable): string[] {
  const errors: string[] = [];
  let leader;
  try {
    leader = defs.get(deck.leader);
  } catch {
    return [`Unknown Leader card ${deck.leader}`];
  }
  if (leader.category !== 'Leader') errors.push(`${deck.leader} is not a Leader card (CR 5-1-2).`);
  if (deck.main.length !== DECK_SIZE)
    errors.push(
      `The deck has ${deck.main.length} cards; it must have exactly ${DECK_SIZE} (CR 5-1-2).`,
    );
  const counts = new Map<CardId, number>();
  for (const id of deck.main) {
    let def;
    try {
      def = defs.get(id);
    } catch {
      errors.push(`Unknown card ${id}`);
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (def.category === 'Leader')
      errors.push(
        `${id} is a Leader; the deck holds only Characters, Events and Stages (CR 5-1-2-1).`,
      );
    const off = def.colors.filter((c) => !leader.colors.includes(c));
    if (off.length)
      errors.push(`${id} has a color (${off.join(', ')}) the Leader does not have (CR 5-1-2-2).`);
  }
  for (const [id, n] of counts) {
    if (n > MAX_COPIES)
      errors.push(`${n} copies of ${id}; the limit is ${MAX_COPIES} per card number (CR 5-1-2-3).`);
  }
  return [...new Set(errors)];
}

// ---------------------------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------------------------

export function createGame(setup: GameSetup): Step {
  const defs = new DefTable(setup.cards);
  for (const p of PLAYERS) {
    const errors = validateDeck(setup.decks[p], defs);
    if (errors.length) throw new InvalidSetup(`${p} deck: ${errors.join(' ')}`);
  }
  const s = baseState(setup.seed, defs);
  const d = new Draft(s);
  for (const p of PLAYERS) {
    const spec = setup.decks[p];
    const ps = d.pl(p);
    // CR 5-2-1-2: shuffle and place the deck; CR 5-2-1-3: place the Leader face up.
    for (const id of spec.main) {
      ps.deck.push(
        addCard(d, { card: id, owner: p, zone: 'deck', rested: false, faceUp: false, don: 0 }),
      );
    }
    shuffleDeck(d, p);
    ps.leader = addCard(d, {
      card: spec.leader,
      owner: p,
      zone: 'leader',
      rested: false,
      faceUp: true,
      don: 0,
    });
    const don = donDeckSizeFor(spec.leader);
    ps.donDeck = don;
    s.setup.leader[p] = spec.leader;
    s.setup.deckSize[p] = spec.main.length;
    s.setup.donSize[p] = don;
  }
  // CR 5-2-1-4: a random method decides who chooses first or second.
  let chooser = setup.chooser;
  if (!chooser) {
    let v: number;
    [v, d.s.rng] = nextInt(d.s.rng, 2);
    chooser = v === 0 ? 'p1' : 'p2';
  }
  d.s.setup = { ...d.s.setup, chooser };
  d.emit({ type: 'GameStarted', chooser });
  d.stack().push({ f: 'setup', step: 'chooseFirst' });
  advance(d);
  return { state: d.finish() as never, events: d.events };
}

// ---------------------------------------------------------------------------------------------
// createFromScenario
// ---------------------------------------------------------------------------------------------

const PHASE_STEP: Record<Exclude<Phase, 'setup'>, Extract<Frame, { f: 'turn' }>['step']> = {
  refresh: 'refresh',
  draw: 'draw',
  don: 'don',
  main: 'main',
  end: 'endTriggers',
};

function placement(x: CardId | CardPlacement): CardPlacement {
  return typeof x === 'string' ? { card: x } : x;
}

export function createFromScenario(spec: ScenarioSpec): Step {
  const fail = (m: string): never => {
    throw new InvalidSetup(`Invalid scenario: ${m}`);
  };
  if (!Number.isInteger(spec.turn) || spec.turn < 1)
    fail('turn must be a whole number of 1 or more');
  const expectedActive = spec.turn % 2 === 1 ? spec.firstPlayer : other(spec.firstPlayer);
  if (spec.activePlayer !== expectedActive)
    fail(
      `turn ${spec.turn} belongs to ${expectedActive} when ${spec.firstPlayer} goes first (odd turns are the first player's)`,
    );
  const phase = spec.phase ?? 'main';
  if (phase === 'setup') fail('scenarios start at a turn phase, not in setup');

  const defs = new DefTable(spec.cards);
  const s = baseState(spec.seed, defs);
  s.turn = spec.turn;
  s.active = spec.activePlayer;
  s.first = spec.firstPlayer;
  s.phase = phase;
  const d = new Draft(s);

  for (const p of PLAYERS) {
    const ps0: PlayerSpec = spec[p];
    const ps = d.pl(p);
    const leaderP = placement(ps0.leader);
    const leaderDef = defs.get(leaderP.card);
    if (leaderDef.category !== 'Leader') fail(`${p} leader ${leaderP.card} is not a Leader card`);
    const mk = (pl: CardPlacement, zone: CardInst['zone'], allowDon: boolean): InstanceId => {
      const def = defs.get(pl.card);
      if (zone !== 'leader' && def.category === 'Leader')
        fail(`${pl.card} is a Leader and cannot be in ${p}.${zone}`);
      if (zone === 'characters' && def.category !== 'Character')
        fail(`${pl.card} is not a Character card`);
      if (zone === 'stage' && def.category !== 'Stage') fail(`${pl.card} is not a Stage card`);
      const don = pl.don ?? 0;
      if (!Number.isInteger(don) || don < 0) fail(`${pl.card}: DON!! must be a whole number`);
      if (don > 0 && !allowDon)
        fail(`${pl.card}: DON!! can be given only to a Leader or Character`);
      if (pl.playedThisTurn && zone !== 'characters' && zone !== 'stage')
        fail(`${pl.card}: only Characters and Stages can be played this turn`);
      if (pl.rested && !['leader', 'characters', 'stage'].includes(zone))
        fail(`${pl.card}: only cards on the field can be rested`);
      if (pl.faceUp && zone !== 'life') fail(`${pl.card}: only Life cards are placed face up`);
      return addCard(d, {
        card: pl.card,
        owner: p,
        zone,
        rested: pl.rested ?? false,
        faceUp: zone === 'life' ? (pl.faceUp ?? false) : zone !== 'deck' && zone !== 'hand',
        don,
        played: pl.playedThisTurn ? spec.turn : -1,
      });
    };
    ps.leader = mk(leaderP, 'leader', true);
    const used: CardId[] = [];
    for (const c of ps0.hand ?? []) {
      ps.hand.push(mk({ card: c }, 'hand', false));
      used.push(c);
    }
    for (const c of ps0.life ?? []) {
      const pl = placement(c);
      ps.life.push(mk(pl, 'life', false));
      used.push(pl.card);
    }
    const chars = ps0.characters ?? [];
    if (chars.length > MAX_CHARACTERS) fail(`${p} has ${chars.length} Characters; the limit is 5`);
    for (const c of chars) {
      const pl = placement(c);
      ps.characters.push(mk(pl, 'characters', true));
      used.push(pl.card);
    }
    if (ps0.stage !== undefined) {
      const pl = placement(ps0.stage);
      ps.stage.push(mk(pl, 'stage', false));
      used.push(pl.card);
    }
    for (const c of ps0.trash ?? []) {
      ps.trash.push(mk({ card: c }, 'trash', false));
      used.push(c);
    }
    if (ps0.deck) {
      for (const c of ps0.deck) ps.deck.push(mk({ card: c }, 'deck', false));
    } else if (ps0.decklist) {
      // The rest of the decklist, shuffled with the seed.
      const rest = ps0.decklist.slice();
      for (const c of used) {
        const i = rest.indexOf(c);
        if (i >= 0) rest.splice(i, 1);
      }
      let order: CardId[];
      [order, d.s.rng] = shuffle(rest, d.s.rng);
      for (const c of order) ps.deck.push(mk({ card: c }, 'deck', false));
    }

    // DON!!
    const std = donDeckSizeFor(leaderP.card);
    const given = [ps.leader, ...ps.characters].reduce((n, id) => n + d.card(id).don, 0);
    const active = ps0.costArea?.active ?? 0;
    const rested = ps0.costArea?.rested ?? 0;
    if (active < 0 || rested < 0) fail(`${p} cost area counts must not be negative`);
    const deckDon = ps0.donDeck ?? std - given - active - rested;
    if (deckDon < 0) fail(`${p} has more than ${std} DON!! placed`);
    const total = deckDon + given + active + rested;
    if (total !== std)
      fail(
        `${p} has ${total} DON!! in total; this Leader's DON!! deck has ${std} (CR 5-1-2, M2-09)`,
      );
    ps.donDeck = deckDon;
    ps.donActive = active;
    ps.donRested = rested;
    s.setup.leader[p] = leaderP.card;
    s.setup.donSize[p] = total;
    s.setup.deckSize[p] =
      ps.deck.length +
      ps.hand.length +
      ps.life.length +
      ps.characters.length +
      ps.stage.length +
      ps.trash.length;
  }
  d.s.setup = { ...d.s.setup, chooser: spec.firstPlayer, mulliganed: { p1: true, p2: true } };
  d.stack().push({ f: 'turn', step: PHASE_STEP[phase as Exclude<Phase, 'setup'>] });
  d.emit({ type: 'ScenarioStarted', turn: spec.turn, player: spec.activePlayer, phase });
  advance(d);
  const errors = checkInvariants(d.s);
  if (errors.length) fail(errors.join('; '));
  return { state: d.finish() as never, events: d.events };
}
