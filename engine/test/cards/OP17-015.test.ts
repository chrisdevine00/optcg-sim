/** OP17-015 Marco. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  pick,
  trash,
  V,
} from './helpers.ts';
import { ids } from './helpers-hancock-rosi.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { ATMOS, DOMA, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-015';

describe('OP17-015 Marco', () => {
  /** p2 runs an effect (planted) against p1's Atmos; Marco is on p1's field. */
  const removal = (action: Record<string, unknown>, handCards: string[] = []) => {
    const g = game(
      { leader: RED_LEADER, hand: handCards, characters: [ID, ATMOS] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, action);
    return g;
  };
  const koAtmos = { ko: { from: 'characters', owner: 'opponent', filter: { name: 'Atmos' } } };

  it("if one of your Characters would be removed by your opponent's effect, you may K.O. this Character instead", () => {
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

  it('covers every kind of removal (returned to hand) and Marco may protect itself', () => {
    const g = removal({
      move: {
        what: { from: 'characters', owner: 'opponent', filter: { name: 'Atmos' } },
        to: { zone: 'hand' },
      },
    });
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ATMOS]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it("a battle K.O. is not replaced (only your opponent's effects)", () => {
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
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  describe('[On K.O.]', () => {
    /** Marco is rested and K.O.d in battle by a 7000 Character. */
    const koed = (handCards: string[]) => {
      const g = game(
        { leader: RED_LEADER, hand: handCards, characters: [{ card: ID, rested: true }] },
        { leader: PLAIN_BLUE, characters: [V.c5] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c5),
        target: g.find('p1', 'characters', ID),
      });
      passBlock(g);
      endCounter(g);
      return g;
    };

    it('you may trash 1 "Whitebeard Pirates" card from your hand: play this Character card from your trash', () => {
      const g = koed([DOMA, V.c1]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', DOMA)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(trash(g, 'p1')).toEqual([DOMA]);
      expect(g.zone('p1', 'characters')[0]!.rested).toBe(false);
    });

    it('declining leaves Marco in the trash and the hand untouched', () => {
      const g = koed([DOMA]);
      decline(g);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([DOMA]);
    });

    it('cannot be paid without a "Whitebeard Pirates" card in hand', () => {
      const g = koed([V.c1]);
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    });
  });
});
