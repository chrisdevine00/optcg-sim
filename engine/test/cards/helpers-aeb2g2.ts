/**
 * Constants and helpers for the EB-02 group 2 card tests (EB02-007 to EB02-061). Every card named
 * below is a vanilla, or a card whose text is inert where the test puts it (a hand, a trash, a
 * target, the deck).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  endCounter,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';

export { canPick, activate, offeredAb, orderAll } from './helpers-w3s.ts';
export { offers, canActivate, canAttack } from './helpers-op16g1.ts';
export { finishBattle } from './helpers-eb03g1.ts';
export { counterGame, koByEffect } from './helpers-op14g4.ts';
export { boost } from './helpers-op15g1.ts';
export { BLUE, PURPLE, V, PLAIN_BLUE };

/** ST01-001 Luffy Leader (Red, {Straw Hat Crew}); only an [Activate: Main] (inert here). */
export const SHC_LEADER = 'ST01-001';
/** ST04-001 Kaido Leader (Purple, {Animal Kingdom Pirates}): not multicolored, not Straw Hat Crew. */
export const OTHER_LEADER = 'ST04-001';
/** OP04-001 Vivi Leader (Blue/Red, multicolored); it cannot attack (the Character does). */
export const MULTI_LEADER = 'OP04-001';
/** OP02-002 Monkey.D.Garp Leader (Red/Black, {Navy}); its own [Your Turn] text is not scripted. */
export const GARP_LEADER = 'OP02-002';
/** OP11-021 Jinbe Leader ({Fish-Man}), OP11-022 Shirahoshi Leader ({Merfolk}); both inert here. */
export const FISH_LEADER = 'OP11-021';
export const MERFOLK_LEADER = 'OP11-022';

/** {Impel Down} Characters: Blugori cost 1 (vanilla), Prince Bellett cost 2, Minorhinoceros cost 3, Sphinx cost 4. */
export const IMPEL1 = 'OP02-084';
export const IMPEL2 = 'EB01-026';
export const IMPEL3 = 'OP03-069';
export const IMPEL4 = 'OP02-088';
/** Black {Navy} Characters: Komille cost 1, Saul cost 4 (vanilla), Onigumo cost 5, All-Hunt Grount cost 6. */
export const NAVY1 = 'OP02-097';
export const NAVY4 = 'OP02-109';
export const NAVY5 = 'OP02-095';
export const NAVY6 = 'EB02-042';
/** Purple {Navy} cost 4 (not black) and black non-Navy cost 4 (Lola). */
export const NAVY_PURPLE4 = 'EB02-034';
export const BLACK_PLAIN4 = 'OP06-094';
/** {CP9}/{CP0} Characters: Kumadori cost 4, Jabra cost 5, Gismonda cost 2 (CP0), Maha cost 6 (CP0). */
export const CP4 = 'OP03-082';
export const CP5 = 'OP03-085';
export const CP2 = 'OP07-084';
export const CP6 = 'OP07-089';
/** Another [Blueno] (OP03-090, cost 5, {CP9}): excluded by name. */
export const BLUENO_OTHER = 'OP03-090';
/** [Laboon] Characters: cost 2 and cost 4 (both inert in a hand or a trash). */
export const LABOON2 = 'EB01-047';
export const LABOON4 = 'EB01-048';
/** {Scientist} Characters: Atlas cost 5 and Shaka cost 5 (inert), Pythagoras cost 6 (vanilla), [Vegapunk] cost 2. */
export const SCI5 = 'OP07-098';
export const SCI5B = 'OP07-101';
export const SCI6 = 'OP13-111';
export const VEGAPUNK2 = 'EB04-057';
/** Yellow {Straw Hat Crew}: Luffy cost 3, Chopper cost 5 (vanillas), Robin cost 6. */
export const YSHC3 = 'ST09-011';
export const YSHC5 = 'P-089';
export const YSHC6 = 'OP09-107';
/** Non-yellow {Straw Hat Crew}: green Usopp cost 3; red [Sanji] cost 1; yellow [Sanji] cost 2 ({The Vinsmoke Family}). */
export const NSHC3 = 'OP02-028';
export const SANJI_RED1 = 'OP04-007';
export const SANJI_YELLOW2 = 'OP03-102';

export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

/** A p1 position with 10 active DON!! and the {Straw Hat Crew} Leader unless given; the opponent has a plain Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: SHC_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/**
 * p2 (turn 4) attacks p1's Leader with a 9000-power Character, nobody blocks, and p1's top Life
 * card is `top`: the position stops at the [Trigger] decision. `p2chars` stand beside the attacker.
 */
export function trigGame(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2chars: string[] = [],
): TestGame {
  const g = game(
    { leader: SHC_LEADER, life: [top, PURPLE, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7, ...p2chars] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/**
 * The shared "look at 4, reveal up to 1 card with a cost of 4 or more, add it to your hand, rest to
 * the bottom in any order; [Trigger] activate this card's [Main] effect" (EB02-008, 020, 031, 040,
 * 050, 058): six tests per card.
 */
export function describeMusic(id: string, name: string): void {
  // Top 4: cost 1, 4, 5, 2. The 5th and 6th cards are not looked at.
  const DECK = [V.c1, V.c4, V.c5, V.c2, V.c7, V.c6];
  const run = (deck: string[] = DECK) => {
    const g = mk({ hand: [id], deck, costArea: { active: 2, rested: 0 } });
    play(g, id);
    return g;
  };
  const settleOrder = (g: TestGame) => {
    while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
  };
  describe(`${id} ${name}`, () => {
    it('[Main] looks at 4 and takes a card with a cost of 4 or more (4 is enough); the rest go to the bottom', () => {
      const g = run();
      expectDecision(g, 'choose', 'p1');
      const offered = g
        .legal()
        .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
      expect(offered.sort()).toEqual(
        [g.find('p1', 'deck', V.c4), g.find('p1', 'deck', V.c5)].sort(),
      );
      pick(g, [g.find('p1', 'deck', V.c5)]);
      settleOrder(g);
      expectDecision(g, 'main', 'p1');
      expect(hand(g, 'p1')).toEqual([V.c5]);
      const deck = ids(g, 'p1', 'deck');
      expect(deck.slice(0, 2)).toEqual([V.c7, V.c6]);
      expect(deck.slice(2).sort()).toEqual([V.c1, V.c4, V.c2].sort());
    });

    it('a cost 3 card is not enough, and the 5th card is not looked at even with cost 4 or more', () => {
      const g = run([V.c3, V.c2, V.c1, V.c3, V.c7]);
      expectDecision(g, 'choose', 'p1');
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
      none(g);
      settleOrder(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(ids(g, 'p1', 'deck')[0]).toBe(V.c7);
      expect(ids(g, 'p1', 'deck')).toHaveLength(5);
    });

    it('"up to 1": may take nothing; all 4 cards go to the bottom', () => {
      const g = run();
      none(g);
      settleOrder(g);
      expect(hand(g, 'p1')).toEqual([]);
      const deck = ids(g, 'p1', 'deck');
      expect(deck.slice(0, 2)).toEqual([V.c7, V.c6]);
      expect(deck).toHaveLength(6);
    });

    it('only 1 card is taken even with two matches', () => {
      const g = run([V.c4, V.c5, V.c6, V.c7, V.c1]);
      pick(g, [g.find('p1', 'deck', V.c6)]);
      settleOrder(g);
      expect(hand(g, 'p1')).toEqual([V.c6]);
      expect(ids(g, 'p1', 'deck')[0]).toBe(V.c1);
    });

    it('the Event is trashed after it resolves and nothing is revealed to be added when none is taken', () => {
      const g = run();
      none(g);
      settleOrder(g);
      expect(ids(g, 'p1', 'trash')).toEqual([id]);
    });

    it('[Trigger] activates the [Main] effect', () => {
      const g = trigGame(id, { deck: DECK });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'deck', V.c4)]);
      settleOrder(g);
      expect(hand(g, 'p1')).toEqual([V.c4]);
      expect(ids(g, 'p1', 'life')).toHaveLength(2);
    });
  });
}
