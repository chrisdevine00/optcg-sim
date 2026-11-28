/**
 * Seeded positions for the counter and DON!! banks (M9 WP3). A position is a `ScenarioJson` (card ids
 * only, no art) built from an archetype's sourced lists: one seed, one position, no clock.
 *
 * Two shapes, the player always p1:
 * - `defence`: p2 (the attacker) is on its Main with 1 to 3 Characters and its DON!! given or spent,
 *   an empty hand, and p1 holds a few cards from its own list; the drill cuts it at p1's counter step.
 *   The attacker's hand is empty so nothing hidden bears on the answer (certainty `any-hand`).
 * - `main`: p1 is on its own Main with a fresh DON!! row, a hand drawn from its list and a short board.
 *
 * Every Life card is `INERT_LIFE` (a vanilla Character with no [Trigger]): the drills ask about the
 * arithmetic of the table, and a Life card's Trigger is the one thing no view of it can settle.
 */
import type { Card } from '@optcg/cards';
import { nextInt, seedRng, shuffle, type CardPlacement } from '@optcg/engine';
import { SCRIPTS } from '@optcg/cards';
import { counterValueOf } from '../../knowledge.ts';
import type { ScenarioJson } from './types.ts';

/**
 * The version of the WP3 generators (positions, classes, lines). Bump it when any of them changes what
 * a seed builds; the committed banks record it in `builtWith.scripts` and a test compares.
 */
export const DRILL_SCRIPTS_VERSION = 'wp3-2';

/**
 * The Leaders the owner practises (M11 Track C): every generator gives each of them its own
 * deterministic pass, so a bank holds at least `FOCUS_MIN` items with the Leader in the player's seat
 * however the seeded walk over all fourteen pairs happens to fall. The number is a target, not a rule:
 * a generator that cannot reach it with items that pass its own admission rule says so in its log and
 * the bank holds what it found (the tests then name the shortfall; nothing is relaxed to reach it).
 */
export const FOCUS_LEADERS: readonly string[] = ['OP18-021', 'EB02-010'];
export const FOCUS_MIN = 6;

/** A vanilla Character (Mocha, OP01-081): no effect and no [Trigger], so face-down Life that holds it is inert. */
export const INERT_LIFE = 'OP01-081';

/** An archetype's sourced lists, each the 50 main-deck card ids (never the Leader). */
export interface ListSet {
  archetypeId: string;
  leaderId: string;
  lists: string[][];
}

type Cards = ReadonlyMap<string, Card>;

/** A seeded stream of integers below `n`. */
class Stream {
  s: number;
  constructor(seed: number) {
    // Two rounds of mixing so that seeds 1, 2, 3 do not share a first draw.
    this.s = seedRng(Math.imul(seed + 0x9e3779b9, 0x85ebca6b) >>> 0);
    this.int(2);
  }
  int(n: number): number {
    const [v, next] = nextInt(this.s, n);
    this.s = next;
    return v;
  }
  pick<T>(xs: readonly T[]): T {
    return xs[this.int(xs.length)]!;
  }
  shuffled<T>(xs: readonly T[]): T[] {
    const [out, next] = shuffle(xs, this.s);
    this.s = next;
    return out;
  }
}

/** DON!! in a Leader's DON!! deck (10, or what its script says). */
export function donDeckSize(leader: string): number {
  const rule = SCRIPTS[leader]?.rules?.find((r) => 'donDeckSize' in r);
  return rule && 'donDeckSize' in rule ? rule.donDeckSize : 10;
}

const isBlocker = (c: Card | undefined): boolean => !!c?.keywords.includes('Blocker');

/** The distinct card ids of a list, in order of first appearance. */
const distinct = (ids: readonly string[]): string[] => [...new Set(ids)];

/** Up to `n` ids drawn from the list's copies, `prefer` first (a bias, not a filter). */
function draw(
  s: Stream,
  list: readonly string[],
  n: number,
  prefer: (id: string) => boolean = () => false,
): string[] {
  const all = s.shuffled(list);
  const first = all.filter(prefer);
  const rest = all.filter((id) => !prefer(id));
  return [...first, ...rest].slice(0, n);
}

export interface DefenceKnobs {
  /** The attacker's game turn (even when the player went first). */
  turn: number;
}

/**
 * A defence position: p2 attacks, p1 defends with `hand` against Characters and a Leader that carry
 * given DON!!. Returns null when the lists cannot fill it (no Character to attack with).
 */
export function defencePosition(
  seed: number,
  mine: ListSet,
  theirs: ListSet,
  cards: Cards,
  /** A focus pass counts the Counter a Leader gives a card in hand (OP18-021's Stages) when it biases the hand. */
  leaderGrants = false,
): ScenarioJson | null {
  const s = new Stream(seed);
  const ownList = s.pick(mine.lists);
  const theirList = s.pick(theirs.lists);
  const turn = [4, 4, 6, 6, 8][s.int(5)]!;

  // The attacker: Characters from its list that cost what its DON!! would have bought, one DON!! row.
  const pool = distinct(theirList).filter((id) => {
    const c = cards.get(id);
    return c?.category === 'Character' && c.power !== null && (c.cost ?? 99) <= Math.min(turn, 7);
  });
  if (pool.length === 0) return null;
  // Two in three positions press: Life 1 or 2 against about as many attackers as it takes to lose.
  const pressure = s.int(3) !== 0;
  const life = pressure ? 1 + s.int(2) : 1 + s.int(4);
  const nAttackers = pressure ? Math.min(3, life + 1 + s.int(2)) : 1 + s.int(3);
  const attackers = s.shuffled(pool).slice(0, nAttackers);
  // DON!! given to the Leader and the Characters; at most 2 left active in the cost area.
  const don = Math.min(donDeckSize(theirs.leaderId), turn);
  const active = s.int(3) === 0 ? 1 + s.int(2) : 0;
  let spare = Math.max(0, don - active);
  const placed: CardPlacement[] = attackers.map((card) => ({ card, don: 0 }));
  const leaderOwn: CardPlacement = { card: theirs.leaderId, don: 0 };
  const slots = [leaderOwn, ...placed];
  // Spread the given DON!! one at a time; a Character takes at most 4.
  while (spare > 0) {
    const slot = s.pick(slots);
    if ((slot.don ?? 0) < (slot === leaderOwn ? 6 : 4)) {
      slot.don = (slot.don ?? 0) + 1;
      spare--;
    } else if (slots.every((x) => (x.don ?? 0) >= (x === leaderOwn ? 6 : 4))) break;
  }

  // The defender: a hand from its own list and no Blocker.
  const counterCard = (id: string) =>
    counterValueOf(cards.get(id), leaderGrants ? mine.leaderId : undefined) > 0;
  const handSize = pressure ? 4 + s.int(2) : 2 + s.int(3);
  const hand = draw(s, ownList, handSize, counterCard);
  const board = draw(
    s,
    distinct(ownList).filter((id) => {
      const c = cards.get(id);
      return c?.category === 'Character' && !isBlocker(c);
    }),
    s.int(3),
  );
  const ownDon = Math.min(donDeckSize(mine.leaderId), turn - 1);
  const ownActive = s.int(ownDon + 1);

  return {
    seed,
    turn,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: mine.leaderId,
      hand,
      life: Array.from({ length: life }, () => INERT_LIFE),
      characters: board,
      costArea: { active: ownActive, rested: ownDon - ownActive },
      decklist: ownList,
    },
    p2: {
      leader: leaderOwn.don ? { card: theirs.leaderId, don: leaderOwn.don } : theirs.leaderId,
      characters: placed.map((p) => (p.don ? { card: p.card, don: p.don } : p.card)),
      life: Array.from({ length: 3 + s.int(3) }, () => INERT_LIFE),
      hand: [],
      costArea: { active, rested: 0 },
      decklist: theirList,
    },
  };
}

/**
 * A Main-phase position for the DON!! drill: p1 is active with all its DON!! fresh, a hand of
 * `5 to 6` cards from its list (biased towards Characters it can pay for), a short board, and an
 * opponent with a Leader and a couple of Characters to hit.
 */
export function mainPosition(
  seed: number,
  mine: ListSet,
  theirs: ListSet,
  cards: Cards,
  /**
   * A focus pass (M11 Track C) builds the position around the Leader's own ability: a Stage of cost 5
   * or less in the hand for OP18-021, a board of Straw Hat Crew Characters only for EB02-010. It
   * changes what the seed draws, so the base walk never sets it and its items stay as they were.
   */
  focus = false,
): ScenarioJson | null {
  const s = new Stream(seed);
  const ownList = s.pick(mine.lists);
  const theirList = s.pick(theirs.lists);
  const first = s.int(2) === 0;
  const turn = (first ? [3, 5, 5, 7] : [4, 6, 6, 8])[s.int(4)]!;
  const don = Math.min(donDeckSize(mine.leaderId), turn);
  const affordable = (id: string) => {
    const c = cards.get(id);
    return c?.category === 'Character' && (c.cost ?? 99) <= don && (c.cost ?? 0) >= 1;
  };
  const luffy = focus && mine.leaderId === 'EB02-010';
  const franky = focus && mine.leaderId === 'OP18-021';
  const shc = (id: string) => cards.get(id)?.types.includes('Straw Hat Crew') ?? false;
  const stage = (id: string) => {
    const c = cards.get(id);
    return c?.category === 'Stage' && (c.cost ?? 99) <= 5;
  };
  // Luffy's hand is Straw Hat Crew Characters (anything else played first would end his condition).
  const hand = draw(
    s,
    luffy ? ownList.filter(shc) : ownList,
    5 + s.int(2),
    franky ? (id) => stage(id) || affordable(id) : affordable,
  );
  if (!hand.some(affordable)) return null;
  if (franky && !hand.some(stage)) return null;
  const board = draw(
    s,
    distinct(ownList).filter((id) => {
      const c = cards.get(id);
      return (
        c?.category === 'Character' &&
        c.power !== null &&
        (c.cost ?? 99) <= 5 &&
        (!luffy || shc(id))
      );
    }),
    luffy ? 1 + s.int(2) : s.int(3),
  );
  const foes = draw(
    s,
    distinct(theirList).filter((id) => {
      const c = cards.get(id);
      return c?.category === 'Character' && c.power !== null && (c.cost ?? 99) <= 6;
    }),
    1 + s.int(2),
  );
  const theirDon = Math.min(donDeckSize(theirs.leaderId), turn - (first ? 1 : -1));
  return {
    seed,
    turn,
    activePlayer: 'p1',
    firstPlayer: first ? 'p1' : 'p2',
    p1: {
      leader: mine.leaderId,
      hand,
      life: Array.from({ length: 4 }, () => INERT_LIFE),
      characters: board,
      costArea: { active: don, rested: 0 },
      decklist: ownList,
    },
    p2: {
      leader: theirs.leaderId,
      characters: foes.map((card) => ({ card, rested: true })),
      life: Array.from({ length: 3 + s.int(2) }, () => INERT_LIFE),
      hand: [],
      costArea: { active: theirDon, rested: 0 },
      decklist: theirList,
    },
  };
}
