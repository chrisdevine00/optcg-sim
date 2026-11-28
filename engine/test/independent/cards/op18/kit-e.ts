/**
 * Helpers for the OP-18 group-E independent card tests (OP18-085 .. OP18-119: the Black
 * Holy Knights / Giants and the Yellow CP9 / Navy cards). Public API, frozen fixtures and the
 * earlier kits only. Scenery stats are noted next to each constant.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, CardPlacement, PlayerSpec } from '@optcg/engine';
import { withAbilities } from '../../../../src/testing.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { atMain, kind, need, none, offeredIds, pickCards } from './kit-ga.ts';
import { mine as mineA, theirs as theirsA } from '../m4b/kit-a.ts';

export * from './kit-ga.ts';

/** Leaders. OP03-076 is a vanilla-for-our-purposes CP9 Leader (unscripted, 5 Life). */
export const LE = {
  /** OP03-076 Rob Lucci: Black, 5000, 5 Life, {CP9}. Unscripted, so its [Your Turn] text is inert. */
  cp: 'OP03-076',
  /** OP18-060 Saint Gunko: Purple/Black, 5000, 4 Life, {Celestial Dragons}/{Holy Knights of God}. Abilities removed (see `inert`). */
  cd: 'OP18-060',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Neither CP nor Celestial Dragons. */
  luffy: 'ST01-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. */
  navy: 'ST06-001',
  /** OP17-079 Monkey.D.Luffy: Black, 5000, 5 Life, {Elbaph}. Not used in play (its text gives Blocker). */
  elbaphLeader: 'OP17-079',
} as const;

/** Scenery cards. */
export const X = {
  /** OP03-082 Kumadori: Black, cost 4, 6000, Counter +1000, {CP9}. No text. */
  cp4: 'OP03-082',
  /** OP03-087 Nero: Black, cost 3, 5000, Counter +1000, {CP9}. No text. */
  cp3: 'OP03-087',
  /** OP03-085 Jabra: Black, cost 5, 7000, Counter +1000, {CP9}. No text. */
  cp5: 'OP03-085',
  /** OP03-084 Jerry: Black, cost 2, 4000, Counter +1000, {CP6}. No text. */
  cp2: 'OP03-084',
  /** OP07-089 Maha: Black, cost 6, 8000, Counter +1000, {CP0}. No text. */
  cp0c6: 'OP07-089',
  /** OP13-085 Saint Jalmac: Black, cost 2, 4000, Counter +1000, {Celestial Dragons}. No text. */
  cd2: 'OP13-085',
  /** OP05-084 Saint Charlos: Black, cost 3, 0, {Celestial Dragons}; own text only on its Your Turn. Not used as scenery in play. */
  /** OP18-085 Cerberus: Black, cost 1, 0, Counter +2000, {Holy Knights of God}. [Activate: Main] return itself. */
  cerberus: 'OP18-085',
  /** OP18-088 Saint Sommers: Black, cost 6, 6000, Counter +2000, {Celestial Dragons}/{Holy Knights of God}. */
  sommers: 'OP18-088',
  /** OP18-119 Saint Shamrock: Black, cost 8, 9000, no Counter, {Celestial Dragons}/{Holy Knights of God}. */
  shamrock: 'OP18-119',
  /** OP18-086 Goldberg: Black, cost 3+12, 4000, Counter +1000, {Giant}/{Elbaph}. */
  goldberg: 'OP18-086',
  /** OP18-087 Stansen: Black, cost 3+12, 4000, Counter +1000. */
  stansen: 'OP18-087',
  /** OP18-089 Dorry: Black, cost 4+12, 5000, Counter +2000. */
  dorry: 'OP18-089',
  /** OP18-091 Brogy: Black, cost 4+12, 5000, Counter +2000. */
  brogy: 'OP18-091',
  /** OP18-092 Roronoa Zoro: Black, cost 2, 2000, Counter +1000, {Elbaph}/{Straw Hat Crew}. */
  zoro: 'OP18-092',
  /** OP18-093 Sleeptids: Black, cost 9, 3000, Counter +2000, {Elbaph}, [Blocker]. */
  sleeptids: 'OP18-093',
  /** OP17-088 Hajrudin: Black, cost 7, 8000, Counter +2000, {Giant}/{Elbaph}. */
  hajrudinGiant: 'OP17-088',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1. Inert. */
  stage: 'OP05-021',
} as const;

/** Remove the printed abilities of the named cards in this game (so they act as bare scenery). */
export function inert(g: TestGame, ...ids: string[]): TestGame {
  for (const id of ids) {
    try {
      g.state = withAbilities(g.state, id, []);
    } catch {
      // not in this game
    }
  }
  return g;
}

/** p1's Main Phase with 10 active DON!!; the Saint Gunko Leader is made inert. */
export function mineE(
  leader: string | CardPlacement,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader?: string,
): TestGame {
  const g = p2Leader ? mineA(leader, spec, p2, p2Leader) : mineA(leader, spec, p2);
  return inert(g, 'OP18-060');
}

/** p2's Main Phase; p1 defends. */
export function theirsE(
  leader: string,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader?: string,
): TestGame {
  const g = p2Leader ? theirsA(leader, spec, p2, p2Leader) : theirsA(leader, spec, p2);
  return inert(g, 'OP18-060');
}

/** A readable dump of the pending decision, for failure messages. */
export function dump(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  return `${d.kind}/${d.purpose ?? '-'} for ${d.player}: ${d.prompt} [${(d.options ?? [])
    .map((o) => `${o.id}=${o.label}`)
    .join(', ')}]`;
}

export type { CardId };

/** p2's Leader attacks p1's Leader; p1 (top Life = `card`) does not block or counter and faces the Trigger decision. */
export function triggerHit(
  card: string,
  leader: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = theirsE(leader, { life: [card, 'OP02-060', 'OP02-060', 'OP02-060'], ...p1 }, p2);
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  if (decision(g)?.kind === 'block') act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  return g;
}

/** Pick the named option (a `choose` over modes / top-bottom) of the pending decision. */
export function pickOption(g: TestGame, id: string): void {
  const d = decision(g);
  if (!d || d.kind !== 'choose' || !(d.options ?? []).some((o) => o.id === id)) {
    throw new Error(`Option ${id} is not offered: ${dump(g)}`);
  }
  act(g, { type: 'pick', choice: { option: id } });
}

/** "Hand" cards for CP Life-adding tests. */
export const CPHAND = {
  /** OP08-091 Whos.Who: type "Former CP9" (a type that merely includes "CP"), cost 5. */
  former: 'OP08-091',
} as const;

/**
 * Shared tests for "Add up to 1 card with a type including "CP" from your hand to the top or
 * bottom of your Life cards face-up." `start(hand)` must put the game at the effect's card prompt
 * with p1 holding `hand` (plus anything the card itself needs or drew) and 4 Life cards.
 * `main` is the player who is at their Main Phase once the effect is over (default p1).
 */
export function describeLifeAdd(cfg: {
  id: string;
  start: (hand: string[]) => TestGame;
  main?: 'p1' | 'p2';
}): void {
  const { id, start } = cfg;
  const main = cfg.main ?? 'p1';
  const MISS = 'OP02-060';
  const cp = [X.cp4, X.cp2, CPHAND.former];
  const handOf = (g: TestGame) => g.zone('p1', 'hand').map((c) => c.card);
  describe(`${id} add up to 1 "CP" card from hand to the top or bottom of Life face-up`, () => {
    it('top: the chosen card becomes the top Life card, face-up; Life 4 -> 5; it left the hand', () => {
      const g = start([X.cp4, MISS]);
      const before = handOf(g).length;
      pickCards(g, [X.cp4]);
      pickOption(g, 'top');
      const life = g.zone('p1', 'life');
      expect(life).toHaveLength(5);
      expect(life[0]!.card).toBe(X.cp4);
      expect(life[0]!.faceUp).toBe(true);
      expect(handOf(g)).toHaveLength(before - 1);
      expect(handOf(g)).not.toContain(X.cp4);
      expect(life.slice(1).every((c) => c.card === MISS)).toBe(true);
    });

    it('bottom: the chosen card becomes the bottom Life card, face-up', () => {
      const g = start([X.cp3, MISS]);
      pickCards(g, [X.cp3]);
      pickOption(g, 'bottom');
      const life = g.zone('p1', 'life');
      expect(life).toHaveLength(5);
      expect(life[4]!.card).toBe(X.cp3);
      expect(life[4]!.faceUp).toBe(true);
      expect(life[0]!.card).toBe(MISS);
    });

    it('"type including": every CP type qualifies (CP9, CP6, "Former CP9"); a non-CP card is not offered', () => {
      const g = start([...cp, MISS, X.zoro]);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...cp].sort());
      none(g);
    });

    it('"up to 1": may add nothing; hand and Life are unchanged', () => {
      const g = start([X.cp4, MISS]);
      const before = handOf(g).length;
      none(g);
      expect(g.zone('p1', 'life')).toHaveLength(4);
      expect(handOf(g)).toHaveLength(before);
      expect(atMain(g, main)).toBe(true);
    });

    it('adds only one card even with several CP cards in hand', () => {
      const g = start([X.cp4, X.cp3, X.cp5]);
      const before = handOf(g).length;
      pickCards(g, [X.cp4]);
      pickOption(g, 'top');
      expect(g.zone('p1', 'life')).toHaveLength(5);
      expect(handOf(g)).toHaveLength(before - 1);
    });

    it('it is not damage: no [Trigger] decision, and the turn goes on', () => {
      const g = start([X.cp4]);
      pickCards(g, [X.cp4]);
      pickOption(g, 'top');
      expect(kind(g)).not.toBe('trigger');
      expect(atMain(g, main)).toBe(true);
    });

    it('with no CP card in hand nothing can be added', () => {
      const g = start([MISS, X.zoro]);
      if (kind(g) === 'choose') {
        expect(offeredIds(g)).toEqual([]);
        none(g);
      }
      expect(g.zone('p1', 'life')).toHaveLength(4);
    });
  });
}

/** Answer pending `order` decisions with the wanted card ids, first (top) to last. */
export function orderBy(g: TestGame, wanted: string[]): void {
  const left = [...wanted];
  for (let i = 0; i < 20 && decision(g)?.kind === 'order'; i++) {
    const d = decision(g)!;
    const options = d.options ?? [];
    const pick = left.length ? options.find((o) => g.card(o.id).card === left[0]) : undefined;
    const first = pick?.id ?? options[0]!.id;
    if (pick) left.shift();
    act(g, { type: 'order', first });
  }
}

/** The Trigger scenery used for every "place a Character at the bottom of the deck" test. */
export const PLACE = {
  c4: 'OP01-018',
  c5: 'OP02-006',
  c6: 'OP02-007',
  c7: 'OP02-020',
  c8: 'OP12-005',
  c9: 'OP01-070',
  c2: 'OP01-012',
} as const;
