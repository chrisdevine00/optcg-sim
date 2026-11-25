/** EB03-001 Nefeltari Vivi (Leader). */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import {
  activate,
  asks,
  boost,
  canAccept,
  canPick,
  game,
  inert,
  koBy,
  offeredAb,
  pickableCards,
  TEN,
  WITH_ON_PLAY,
  WITH_WHEN_ATTACKING,
  KEYWORD_ONLY,
} from './helpers-w6c1.ts';

const ID = 'EB03-001';

describe('EB03-001 Nefeltari Vivi', () => {
  const mk = (
    characters: string[],
    handCards: string[] = [V.c1, V.c2],
    oppChars: string[] = [V.c3],
  ) =>
    game(
      { leader: ID, characters, hand: handCards, costArea: TEN },
      { leader: PLAIN_BLUE, characters: oppChars },
    );
  const rush = (g: ReturnType<typeof mk>, card: string) =>
    g.card(g.find('p1', 'characters', card)).keywords.includes('Rush');

  describe('K.O. replacement', () => {
    it('trashes 1 card from your hand instead of K.O.ing your Character with a base cost of 4 or more', () => {
      const g = mk([V.c4]);
      koBy(g, 'p1', V.c4, 'p2');
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c4]);
      expect(trash(g, 'p1')).toEqual([V.c2]);
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('declining lets the K.O. happen and keeps the hand', () => {
      const g = mk([V.c4]);
      koBy(g, 'p1', V.c4, 'p2');
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1')).toEqual([V.c4]);
      expect(hand(g, 'p1')).toHaveLength(2);
    });

    it('base cost boundary: 4 is covered, 3 is not; a cost raised or lowered by an effect does not change it', () => {
      const three = mk([V.c3]);
      koBy(three, 'p1', V.c3, 'p2');
      expect(dec(three)?.kind).not.toBe('optional');
      expect(three.zone('p1', 'characters')).toHaveLength(0);
      // Base cost 3 raised to 5 is still base cost 3.
      const raised = mk([V.c3]);
      raised.state = applyOp(raised.state, {
        op: 'modifier',
        mod: {
          kind: 'cost',
          target: raised.find('p1', 'characters', V.c3),
          amount: 2,
          duration: { kind: 'thisTurn', turn: 3 },
          controller: 'p1',
        },
      }).state;
      koBy(raised, 'p1', V.c3, 'p2');
      expect(dec(raised)?.kind).not.toBe('optional');
      // Base cost 4 lowered to 2 is still covered.
      const lowered = mk([V.c4]);
      lowered.state = applyOp(lowered.state, {
        op: 'modifier',
        mod: {
          kind: 'cost',
          target: lowered.find('p1', 'characters', V.c4),
          amount: -2,
          duration: { kind: 'thisTurn', turn: 3 },
          controller: 'p1',
        },
      }).state;
      koBy(lowered, 'p1', V.c4, 'p2');
      expectDecision(lowered, 'optional', 'p1');
    });

    it('once per turn: the second K.O. of the turn is not covered', () => {
      const g = mk([V.c4, V.c5], [V.c1, V.c2, V.c3]);
      koBy(g, 'p1', V.c4, 'p2');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      koBy(g, 'p1', V.c5, 'p2');
      expect(dec(g)?.kind).not.toBe('optional');
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c4]);
    });

    it('a declined replacement does not spend the once per turn', () => {
      const g = mk([V.c4, V.c5], [V.c1]);
      koBy(g, 'p1', V.c4, 'p2');
      decline(g);
      koBy(g, 'p1', V.c5, 'p2');
      expectDecision(g, 'optional', 'p1');
    });

    it('cannot be accepted with an empty hand, and does not cover the opponent’s Characters', () => {
      const g = mk([V.c4], []);
      koBy(g, 'p1', V.c4, 'p2');
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      const h = mk([V.c4], [V.c1], [V.c4]);
      koBy(h, 'p2', V.c4, 'p1');
      expect(dec(h)?.kind).not.toBe('optional');
    });
  });

  describe('[Activate: Main] rest this Leader', () => {
    const go = (g: ReturnType<typeof mk>) => activate(g, g.leader('p1'), 'activate');

    it('gives an opponent Character -2000 power this turn, then a Character without a [When Attacking] effect gains [Rush]', () => {
      const g = mk([V.c2, WITH_WHEN_ATTACKING, KEYWORD_ONLY], [], [V.c3]);
      go(g);
      expect(g.card(g.leader('p1')).rested).toBe(true);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(3000);
      // The [When Attacking] Character is not offered; a keyword-only Character is.
      expect(canPick(g, g.find('p1', 'characters', WITH_WHEN_ATTACKING))).toBe(false);
      expect(canPick(g, g.find('p1', 'characters', KEYWORD_ONLY))).toBe(true);
      pick(g, [g.find('p1', 'characters', V.c2)]);
      expect(rush(g, V.c2)).toBe(true);
      expect(rush(g, KEYWORD_ONLY)).toBe(false);
      expect(rush(g, WITH_WHEN_ATTACKING)).toBe(false);
    });

    it('a Character whose only printed text is an [On Play] has no [When Attacking] effect', () => {
      const g = mk([WITH_ON_PLAY], [], []);
      inert(g, WITH_ON_PLAY);
      go(g);
      // No opposing Character, so the first pick is the Rush one.
      expect(pickableCards(g)).toEqual([WITH_ON_PLAY]);
    });

    it('"Then" is not "if you do": with no opponent Character, or choosing none, the Rush is still given', () => {
      const g = mk([V.c2], [], []);
      go(g);
      // No opposing Character: the power pick has nothing to choose, so only the Rush pick remains.
      pick(g, [g.find('p1', 'characters', V.c2)]);
      expect(rush(g, V.c2)).toBe(true);
      const h = mk([V.c2], [], [V.c3]);
      go(h);
      none(h);
      pick(h, [h.find('p1', 'characters', V.c2)]);
      expect(h.card(h.find('p2', 'characters', V.c3)).power).toBe(5000);
      expect(rush(h, V.c2)).toBe(true);
    });

    it('"up to 1": the Rush may be declined too', () => {
      const g = mk([V.c2], [], [V.c3]);
      go(g);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      none(g);
      expect(rush(g, V.c2)).toBe(false);
      expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(3000);
    });

    it('the power loss reads current power: a boosted Character loses 2000 from the boosted value', () => {
      const g = mk([V.c2], [], [V.c3]);
      boost(g, g.find('p2', 'characters', V.c3), 1000);
      go(g);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(4000);
    });

    it('is not offered when the Leader is already rested, and works only once per rest', () => {
      const g = mk([V.c2]);
      expect(offeredAb(g, g.leader('p1'), 'activate')).toBe(true);
      go(g);
      none(g);
      none(g);
      expect(offeredAb(g, g.leader('p1'), 'activate')).toBe(false);
      expect(asks(g)).toBe(false);
    });
  });
});
