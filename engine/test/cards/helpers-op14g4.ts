/**
 * Helpers and constants for the OP-14 group 4 card tests (OP14-087 to OP14-120). Every constant is
 * a vanilla, or a card whose text is inert where the test puts it (trash, hand, a target).
 */
import { applyOp } from '../../src/testing.ts';
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { describe, it, expect } from 'vitest';
import { dec, expectDecision, game, none, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';

/** ST03-001 Crocodile Leader ({Baroque Works}); PLAIN_BLUE is the same card. */
export const BW_LEADER = PLAIN_BLUE;
/** ST04-001 Kaido Leader (not Baroque Works, not Thriller Bark Pirates, not Kuja). */
export const OTHER_LEADER = 'ST04-001';
/** OP06-021 Perona Leader ({Thriller Bark Pirates}); its Activate is not used. */
export const TBP_LEADER = 'OP06-021';
/** OP14-041 Boa Hancock Leader ({Kuja Pirates}). */
export const KUJA_LEADER = 'OP14-041';

/** {Baroque Works} vanillas: [Mr.9] cost 5 (OP14-095, "Baroque Works"), [Crocodile] cost 5 (Former). */
export const BW5 = 'OP14-095';
export const BW5_FORMER = 'OP02-053';
/** [Mr.2.Bon.Kurei(Bentham)] cost 4 (ST30-013, same name as OP14-091), "Former Baroque Works". */
export const BENTHAM = 'ST30-013';
/** {Baroque Works} cost 8 (On Play only, inert in the trash) and cost 6 ([Blocker] only). */
export const BW8 = 'OP04-060';
export const BW6 = 'ST30-010';

/** {Thriller Bark Pirates} vanillas: cost 4 (ST12-005), cost 4 (OP06-094), cost 8 (OP14-101). */
export const TBP4 = 'ST12-005';
export const TBP4B = 'OP06-094';
export const TBP8 = 'OP14-101';
/** {Thriller Bark Pirates} cost 5 ([On Play] only, inert in the trash). */
export const TBP5 = 'OP14-033';
/** Non-TBP vanilla Character: cost 8 (10000). */
export const COST8 = 'OP12-082';
/** Characters with a [Trigger] and no [On Play]: cost 2 [Monet], cost 4 [Jinbe], cost 5 [Zoro]. */
export const TRIG2 = 'OP01-082';
export const TRIG4 = 'EB02-055';
export const TRIG5 = 'OP07-113';
/** {Amazon Lily} cost 4, {Kuja Pirates} cost 6 and cost 5 ([On Play] only). */
export const LILY4 = 'OP08-048';
export const KUJA6 = 'OP16-112';
export const KUJA5 = 'EB04-027';
/** Stage, cost 1 (Activate only) and cost 2. */
export const STAGE1 = 'EB01-011';
export const STAGE2 = 'EB02-009';

export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

/** An effect of the other player K.O.s `owner`'s Character `card`. */
export function koByEffect(g: TestGame, owner: 'p1' | 'p2', card: string, nth = 0): void {
  g.state = applyOp(g.state, {
    op: 'ko',
    card: g.find(owner, 'characters', card, nth),
    by: owner === 'p1' ? 'p2' : 'p1',
  }).state;
}

/** Answer every pending `order` decision in canonical order. */
export function settle(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** A p1 position with a Leader, board and fixed decks; the opponent has a plain Leader. */
export function start(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(p1, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/**
 * p2 (turn 4) attacks p1's Leader with a 7000-power Character (V.c5 by default) (beside `p2chars`), nobody blocks, and
 * p1 activates the [Counter] of `card` (in hand, 1 DON!! available unless `costArea` says otherwise).
 */
export function counterGame(
  card: string,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2chars: string[] = [],
  attacker: string = V.c5,
): TestGame {
  const g = game(
    { hand: [card], costArea: { active: 4, rested: 0 }, life: [PURPLE, PURPLE, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [attacker, ...p2chars] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') g.act({ type: 'block', blocker: null });
  g.act({ type: 'activate', card: g.find('p1', 'hand', card), ability: 'counter' });
  return g;
}

/**
 * The shared [Trigger] "Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or
 * less from your trash rested." (OP14-089, 100, 102, 109, 110, 111, 117): three tests.
 */
export function describeTbpTrigger(id: string): void {
  describe(`${id} [Trigger]`, () => {
    const fire = (trashCards: string[]) => {
      const g = damageWith(id, { trash: trashCards });
      g.act({ type: 'trigger', activate: true });
      return g;
    };
    it('plays a cost 4 {Thriller Bark Pirates} Character from the trash rested; cost 5, cost 8 and other types are not offered', () => {
      const g = fire([TBP4, TBP8, TBP5, V.c4, TRIG4]);
      expectDecision(g, 'choose', 'p1');
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [g.find('p1', 'trash', TBP4)]);
      const c = g.zone('p1', 'characters');
      expect(c.map((x) => x.card)).toEqual([TBP4]);
      expect(c[0]!.rested).toBe(true);
    });
    it('"up to 1": may play nothing', () => {
      const g = fire([TBP4]);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
    it('with no {Thriller Bark Pirates} Character with cost 4 or less in the trash nothing is played', () => {
      const g = fire([TBP8, V.c3]);
      if (dec(g)?.kind === 'choose') none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });
}

export { PURPLE, V };
