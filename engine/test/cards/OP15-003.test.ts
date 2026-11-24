/** OP15-003 Alvida. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { activate, canPick, koBy, offeredAb, plantKo } from './helpers-w3s.ts';

const ID = 'OP15-003';

describe('OP15-003 Alvida', () => {
  const start = (rested: number, chars: string[] = [PURPLE], active = 0) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: chars, costArea: { active, rested } },
    );
  const go = (g: ReturnType<typeof start>) =>
    activate(g, g.find('p1', 'characters', ID), 'give-don');

  it('[Activate: Main] cost: give 1 rested DON!! to a Character; effect: give up to 1 more to the Leader or a Character', () => {
    const g = start(3, [PURPLE, V.c1]);
    go(g);
    // The cost: only the opponent's Characters are offered, exactly 1.
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    // The effect: the Leader is allowed now.
    expect(canPick(g, g.leader('p2'))).toBe(true);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ rested: 1, given: 2 });
  });

  it('the effect is "up to 1": the cost is paid, nothing more is given', () => {
    const g = start(3);
    go(g); // the cost takes the only Character without asking
    none(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
  });

  it('with exactly 1 rested DON!! the cost takes it and the effect has none to give', () => {
    const g = start(1);
    go(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 0, given: 1 });
    expectDecision(g, 'main', 'p1');
  });

  it('is not offered without a rested DON!! of the opponent’s, or without an opposing Character', () => {
    const noRested = start(0, [PURPLE], 3);
    expect(offeredAb(noRested, noRested.find('p1', 'characters', ID), 'give-don')).toBe(false);
    const noChar = start(2, []);
    expect(offeredAb(noChar, noChar.find('p1', 'characters', ID), 'give-don')).toBe(false);
    const ok = start(1);
    expect(offeredAb(ok, ok.find('p1', 'characters', ID), 'give-don')).toBe(true);
  });

  it('Once Per Turn', () => {
    const g = start(4);
    go(g);
    none(g);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });

  describe('K.O. replacement', () => {
    // p2's turn: p2 K.O.s Alvida with an effect.
    const ko = (handCards: string[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID], hand: handCards },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
        { turn: 4, activePlayer: 'p2' },
      );
      plantKo(g, PURPLE);
      activate(g, g.find('p2', 'characters', PURPLE), 'k');
      return g;
    };

    it('may trash a Character card with a power of 6000 or less from hand instead', () => {
      const g = ko([V.c4, V.c5, BLUE]);
      accept(g);
      // 6000 is inclusive; 7000 is not; a Character with 3000 is.
      expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', BLUE))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', V.c5))).toBe(false);
      pick(g, [g.find('p1', 'hand', V.c4)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(trash(g, 'p1')).toEqual([V.c4]);
      expect(hand(g, 'p1')).toHaveLength(2);
    });

    it('declining lets it be K.O.', () => {
      const g = ko([V.c4]);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([V.c4]);
    });

    it('with no eligible Character card in hand (a 7000 one, a non-Character) it is K.O.', () => {
      const g = ko([V.c5, 'ST02-017']);
      // The prompt is asked (the hand is hidden) but accepting is not available.
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('protects only itself, not another Character', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID, V.c1], hand: [V.c4] },
        { leader: PLAIN_BLUE },
      );
      koBy(g, 'p1', V.c1, 'p2');
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([V.c4]);
    });
  });
});
