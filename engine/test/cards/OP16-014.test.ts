/** OP16-014 Marco. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { ids } from './helpers-hancock-rosi.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { ATMOS, RED_LEADER } from './helpers-op17g1.ts';
import { canAccept, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-014';

describe('OP16-014 Marco', () => {
  /** p2 runs an effect (planted) against p1's Atmos; Marco is on p1's field. */
  const removal = (action: Record<string, unknown>) => {
    const g = game(
      { leader: RED_LEADER, characters: [ID, ATMOS] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, action);
    return g;
  };
  const koAtmos = { ko: { from: 'characters', owner: 'opponent', filter: { name: 'Atmos' } } };

  it("if one of your Characters would be removed from the field by your opponent's effect, you may K.O. this Character instead", () => {
    const g = removal(koAtmos);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ATMOS]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('declining lets the Character be removed as the effect says', () => {
    const g = removal(koAtmos);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
  });

  it("a battle K.O. of another Character is not replaced (only your opponent's effects)", () => {
    const g = game(
      { leader: RED_LEADER, characters: [ID, { card: ATMOS, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ATMOS),
    });
    passBlock(g);
    endCounter(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
  });

  describe('[On K.O.]', () => {
    /** Marco is rested and K.O.d in battle by a 9000 Character. */
    const koed = (handCards: string[]) => {
      const g = game(
        { leader: RED_LEADER, hand: handCards, characters: [{ card: ID, rested: true }] },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.find('p1', 'characters', ID),
      });
      passBlock(g);
      endCounter(g);
      return g;
    };

    it('you may trash 1 Character card with 8000 power from your hand: play this Character card from your trash', () => {
      const g = koed([WB8, V.c1]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', WB8)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(trash(g, 'p1')).toEqual([WB8]);
      expect(g.zone('p1', 'characters')[0]!.rested).toBe(false);
    });

    it('declining leaves Marco in the trash and the hand untouched', () => {
      const g = koed([WB8]);
      decline(g);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([WB8]);
    });

    it('cannot be paid with a 7000 power Character', () => {
      const g = koed([WB7]);
      expect(canAccept(g)).toBe(false);
    });
  });
});
