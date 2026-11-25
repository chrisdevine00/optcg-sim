/**
 * Helpers and vanilla constants for the OP-10 group 2 card tests (OP10-036 .. OP10-074). Every card
 * named here is a vanilla, or an unscripted card whose text is inert in these positions.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId, PlayerId } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { accept, dec, decline, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { mk as mkBase } from './helpers-op15g1.ts';
import { canPick as canPickW3 } from './helpers-w3s.ts';

export { mk, boost, RED_LEADER, EVENT, REBECCA_OLD, PLAIN_BLUE } from './helpers-op15g1.ts';
export { attack, finishBattle, restedCard, withDon } from './helpers-op14g1.ts';
export { pickable, canPick, koBy } from './helpers-w3s.ts';
export { finishOrder, cardsOf } from './helpers-luffyace.ts';
export { known } from './helpers-op11g2.ts';

/** {Dressrosa} Leader [Rebecca] (Blue/Black), no script. */
export const DR_LEADER = 'OP04-039';
/** {Dressrosa} Stage [Corrida Coliseum] (cost 1). */
export const DR_STAGE = 'OP04-096';
/** A Stage with no {Dressrosa} type ({Straw Hat Crew}, cost 1). */
export const PLAIN_STAGE = 'EB01-011';
/** {Dressrosa} vanillas: Blue cost 2 / 4000, Blue cost 3 / 5000, Purple cost 5 / 6000, Giant cost 7 / 9000. */
export const DR2 = 'OP01-076';
export const DR3 = 'OP10-054';
export const DR5 = 'EB03-030';
export const DR7 = 'OP10-050';
/** Events: {Revolutionary Army} (Red), {Dressrosa} (Black, cost 4), {Donquixote Pirates} (Blue); a {Kingdom of GERMA} Stage. */
export const RA_EVENT = 'OP05-019';
export const DR_EVENT = 'OP04-094';
export const DP_EVENT = 'OP01-086';
export const GERMA_STAGE = 'OP06-079';
/** {Tontattas} Characters (inert): [Leo] Black cost 1, [Mansherry] Black cost 1. */
export const TONT_LEO = 'OP04-091';
export const TONT_MAN = 'OP05-088';
/** [Monkey.D.Luffy] (Blue, cost 6, {Impel Down}) and a non-Luffy cost-3 vanilla. */
export const LUFFY = 'OP02-062';
/** Revolutionary Army vanillas: cost 2 (Koala), cost 3 (Hack), cost 4 (Kuma), cost 5 (Inazuma). */
export const RA2 = 'EB05-041';
export const RA3 = 'OP05-012';
export const RA4 = 'OP09-108';
export const RA5 = 'OP12-083';
/** ODYSSEY Characters (inert): Green cost 4 (Rob Lucci), Green cost 3 (Lim OP09-037 has no script). */
export const OD4 = 'OP09-038';
export const OD3 = 'OP09-037';
/** Cost-8 vanilla (Red, 10000) and a base cost 7 / 9000 vanilla (purple). */
export const C8 = 'EB02-004';
/** Donquixote Pirates vanillas: Purple cost 4 (Buffalo), cost 5 (Diamante), cost 6 (Diamante OP14-066). */
export const DP4 = 'OP10-073';
export const DP5 = 'OP10-068';
export const DP6 = 'OP14-066';
/** Leaders: Donquixote Pirates (Purple), [Usopp], GERMA (Reiju). All inert (no script). */
export const DP_LEADER = 'OP14-060';
export const USOPP_LEADER = 'OP10-042';
export const GERMA_LEADER = 'OP06-042';
/** Purple Events (trash fodder): cost 2, cost 6; a Blue Event cost 1. */
export const P_EVENT2 = 'OP01-117';
export const P_EVENT6 = 'OP08-077';
export const B_EVENT1 = 'OP01-088';

/** Plant an [Activate: Main] `planted` on p1's Leader whose effect is `actions`, and run it. */
export function runMine(g: TestGame, ...actions: Record<string, unknown>[]): void {
  const leader = g.leader('p1');
  g.state = withAbilities(g.state, g.card(leader).card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: actions.map((a) => ({ do: a })),
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: leader, ability: 'planted' });
}

/** Same, with a cost list. */
export function runMineCost(
  g: TestGame,
  cost: Record<string, unknown>[],
  ...actions: Record<string, unknown>[]
): void {
  const leader = g.leader('p1');
  g.state = withAbilities(g.state, g.card(leader).card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      cost,
      effect: actions.map((a) => ({ do: a })),
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: leader, ability: 'planted' });
}

/** p2 (active) runs a planted effect from its Leader while p1 is the one that owns the cards. */
export function oppRuns(g: TestGame, ...actions: Record<string, unknown>[]): void {
  const leader = g.leader('p2');
  g.state = withAbilities(g.state, g.card(leader).card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: actions.map((a) => ({ do: a })),
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: leader, ability: 'planted' });
}

export const koOpp = { ko: { from: 'characters', owner: 'you', pick: { upTo: 1 } } };
export const bounceMine = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};

/** True when the open decision is a `choose` or `optional` (something was asked). */
export const asked = (g: TestGame): boolean => ['choose', 'optional'].includes(dec(g)?.kind ?? '');

/** Raise the current cost of `target` by `n` this turn (a stand-in for an effect that did it). */
export function raiseCost(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target,
      amount: n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

export type { PlayerId };

/** Cards ids repeated: `n` copies of `card`. */
export const rep = (n: number, card: string): string[] => Array.from({ length: n }, () => card);
/** A deck with `top` on top (in order) and filler under it. */
export const deckOf = (top: string[], filler = 'OP02-060'): string[] => [
  ...top,
  ...rep(10, filler),
];

/**
 * "[On Play] You may rest 1 of your {Dressrosa} Leader or Stage cards: Return up to 1 of your
 * opponent's Characters with a cost of 1 or less to the owner's hand" (OP10-044 Cub, OP10-048 Sai).
 */
export function restBounceSuite(id: string, name: string): void {
  const start = (p1: Parameters<typeof mkBase>[0] = {}, p2chars: string[] = [V.c1, V.c2]) =>
    mkBase({ leader: DR_LEADER, hand: [id], ...p1 }, { characters: p2chars });
  describe(`${id} ${name}`, () => {
    it("[On Play] rest your {Dressrosa} Leader: returns up to 1 of your opponent's Characters with a cost of 1 or less", () => {
      const g = start();
      play(g, id);
      accept(g);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(hand(g, 'p2')).toEqual([V.c1]);
      expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
      expect(g.card(g.leader('p1')).rested).toBe(true);
      expectDecision(g, 'main', 'p1');
    });

    it('boundary: a cost-1 Character is a candidate, a cost-2 Character is not', () => {
      const g = start();
      play(g, id);
      accept(g);
      expect(canPickW3(g, g.find('p2', 'characters', V.c1))).toBe(true);
      expect(canPickW3(g, g.find('p2', 'characters', V.c2))).toBe(false);
    });

    it('rests a {Dressrosa} Stage when the Leader is not {Dressrosa}', () => {
      const g = start({ leader: 'ST01-001', stage: DR_STAGE });
      play(g, id);
      accept(g);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(hand(g, 'p2')).toEqual([V.c1]);
      expect(g.card(g.find('p1', 'stage', DR_STAGE)).rested).toBe(true);
      expect(g.card(g.leader('p1')).rested).toBe(false);
    });

    it('"up to 1": may return nothing (the cost is still paid)', () => {
      const g = start();
      play(g, id);
      accept(g);
      none(g);
      expect(hand(g, 'p2')).toEqual([]);
      expect(g.card(g.leader('p1')).rested).toBe(true);
    });

    it('"You may": declining rests nothing and returns nothing', () => {
      const g = start();
      play(g, id);
      decline(g);
      expect(hand(g, 'p2')).toEqual([]);
      expect(g.card(g.leader('p1')).rested).toBe(false);
    });

    it('must not be payable without an active {Dressrosa} Leader or Stage; your own Characters are never returned', () => {
      const a = start({ leader: 'ST01-001', stage: PLAIN_STAGE });
      play(a, id);
      expectDecision(a, 'main', 'p1'); // the cost cannot be paid: nothing is offered
      expect(hand(a, 'p2')).toEqual([]);

      const b = start({ leader: { card: DR_LEADER, rested: true } });
      play(b, id);
      expectDecision(b, 'main', 'p1');

      const c = start({ characters: [V.c1] });
      play(c, id);
      accept(c);
      expect(canPickW3(c, c.find('p1', 'characters', V.c1))).toBe(false);
    });
  });
}
