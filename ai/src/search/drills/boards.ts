/**
 * Seeded boards for the lethal drill (M9 WP2). A seed, two archetype Leaders and a shape give one
 * position at the player's Main Phase, built only from the archetypes' sourced lists (the public
 * prior) and printed card data. Same arguments, same board, in every run and on every machine.
 *
 * The player is always `p1`. DON!! follow CR 6-4-1: the first player's turn n has n DON!! (1, then
 * +2 each turn), the second player's has n, so a turn-3 or turn-5 first player has 3 or 5, a turn-4
 * second player 4; the opponent has had one turn fewer.
 */
import type { Card } from '@optcg/cards';
import { nextInt, seedRng, shuffle, type PlayerSpec, type ScenarioSpec } from '@optcg/engine';
import { priorFor } from '../../knowledge.ts';
import { harderHand } from './hand.ts';
import type { ScenarioJson } from './types.ts';

/**
 * - `strike`: enough attackers for the hits needed, a small hand to get past: lethal may exist.
 * - `short`: one attacker fewer than the hits needed: no DON!! split can win.
 */
export type BoardShape = 'strike' | 'short';

export interface Board {
  scenario: ScenarioJson;
  /** The player went first. */
  first: boolean;
  mine: string;
  theirs: string;
}

class Rand {
  state: number;
  constructor(seed: number) {
    this.state = seedRng(Math.imul(seed + 1, 0x9e3779b1) ^ 0x85ebca6b);
    // Mulberry32 starts alike for near seeds; spin it.
    for (let i = 0; i < 4; i++) this.int(2);
  }
  int(n: number): number {
    const [v, s] = nextInt(this.state, n);
    this.state = s;
    return v;
  }
  range(lo: number, hi: number): number {
    return lo + this.int(hi - lo + 1);
  }
  pick<T>(xs: readonly T[]): T {
    return xs[this.int(xs.length)]!;
  }
  shuffled<T>(xs: readonly T[]): T[] {
    const [out, s] = shuffle(xs, this.state);
    this.state = s;
    return out;
  }
}

/** One sourced list of an archetype, as a bag of card ids with each card at its list count. */
function bagOf(leader: string, r: Rand): string[] {
  const lists = priorFor(leader).lists;
  const l = lists[r.int(lists.length)]!;
  return l.cards.flatMap((c) => Array.from({ length: c.count }, () => c.id));
}

/** Take `n` ids from `bag` that pass `ok`, in shuffled order (distinct copies). */
function take(bag: string[], n: number, ok: (id: string) => boolean, r: Rand): string[] {
  const out: string[] = [];
  for (const id of r.shuffled(bag)) {
    if (out.length >= n) break;
    if (ok(id)) out.push(id);
  }
  return out;
}

const isTrigger = (c: Card | undefined) => !c || c.triggerText !== null;

/** The seat's `n`-card deck: list cards, shuffled. */
const deckOf = (bag: string[], r: Rand, n = 6) => r.shuffled(bag).slice(0, n);

export function buildBoard(
  seed: number,
  mine: string,
  theirs: string,
  shape: BoardShape,
  cards: ReadonlyMap<string, Card>,
): Board | null {
  const r = new Rand(seed);
  const first = r.int(2) === 0;
  const turn = first ? r.pick([3, 5, 5]) : 4;
  const don = Math.min(10, turn);
  const mineBag = bagOf(mine, r);
  const theirBag = bagOf(theirs, r);
  const card = (id: string) => cards.get(id);
  const myLeader = card(mine);
  const theirLeader = card(theirs);
  if (!myLeader || !theirLeader) return null;

  // Their side first: it fixes the hits needed.
  const life = shape === 'strike' ? r.pick([1, 1, 2]) : r.range(1, 3);
  const theirLife = take(
    theirBag,
    life,
    (id) => card(id)?.category !== 'Leader' && !isTrigger(card(id)),
    r,
  );
  if (theirLife.length < life) return null;
  const theirDon = turn - 1;
  const theirRested = r.range(0, Math.min(theirDon, 3));
  const blockers = take(
    theirBag,
    shape === 'strike' ? r.pick([0, 0, 0, 1]) : r.pick([0, 0, 1, 2]),
    (id) => card(id)?.category === 'Character' && (card(id)?.keywords ?? []).includes('Blocker'),
    r,
  );
  const handSize = shape === 'strike' ? life : r.range(1, 4);

  // Attackers: the Leader and Characters the DON!! affords, the strongest first.
  const attackersTotal = shape === 'strike' ? life + 2 + r.int(2) : life;
  const affordable = take(
    mineBag,
    99,
    (id) => {
      const c = card(id);
      return c?.category === 'Character' && (c.cost ?? 99) <= don && (c.power ?? 0) >= 3000;
    },
    r,
  ).sort((a, b) => (card(b)!.power ?? 0) - (card(a)!.power ?? 0) || (a < b ? -1 : 1));
  const need = attackersTotal - 1;
  if (need > 4 || affordable.length < need) return null;
  // Strong, with some choice: draw the attackers from the top `need + 3` by power.
  const attackers = r.shuffled(affordable.slice(0, need + 1)).slice(0, need);

  // One Character played this turn (cannot attack, no [Rush]): it has used some of the DON!!.
  let spent = 0;
  const fresh: string[] = [];
  if (r.int(3) === 0) {
    const f = take(
      mineBag,
      1,
      (id) => {
        const c = card(id);
        return (
          c?.category === 'Character' &&
          (c.cost ?? 99) <= don - 3 &&
          !(c.keywords ?? []).includes('Rush') &&
          !attackers.includes(id)
        );
      },
      r,
    );
    if (f.length && attackers.length + 1 <= 5) {
      fresh.push(f[0]!);
      spent = card(f[0]!)!.cost ?? 0;
    }
  }
  const myHand = take(mineBag, r.range(0, 3), (id) => card(id)?.category !== 'Leader', r);

  const p1: PlayerSpec = {
    leader: mine,
    hand: myHand,
    deck: deckOf(mineBag, r),
    life: take(
      mineBag,
      Math.min(myLeader.life ?? 4, r.range(3, 5)),
      (id) => card(id)?.category !== 'Leader',
      r,
    ),
    characters: [
      ...attackers,
      ...fresh.map((c) => ({ card: c, playedThisTurn: true as const, rested: false })),
    ],
    costArea: { active: don - spent, rested: spent },
  };
  const p2: PlayerSpec = {
    leader: theirs,
    hand: harderHand(theirs, handSize, cards),
    deck: deckOf(theirBag, r),
    life: theirLife,
    characters: blockers,
    costArea: { active: theirDon - theirRested, rested: theirRested },
  };
  const scenario: ScenarioJson = {
    seed,
    turn,
    activePlayer: 'p1',
    firstPlayer: first ? 'p1' : 'p2',
    p1,
    p2,
  } satisfies Omit<ScenarioSpec, 'cards'>;
  return { scenario, first, mine, theirs };
}
