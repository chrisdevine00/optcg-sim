/** OP13-060 Amatsuki Toki. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import {
  idsOf,
  koedInBattle,
  mine,
  plant,
  plantOpponentEffect,
  RP,
  SHANKS,
} from './helpers-op13g3.ts';

const ID = 'OP13-060';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP13-060 Amatsuki Toki', () => {
  /** p2's turn: p2's planted effect K.O.s one of p1's Characters. */
  const byOpponent = (p1chars: string[], target: string) => {
    const g = mine({ characters: p1chars }, {}, 6);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', target)]);
    return g;
  };

  it("instead of your {Roger Pirates} Character being K.O.'d by your opponent's effect, you may trash Toki", () => {
    const g = byOpponent([ID, RP], RP);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([RP]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it("may be declined: the Character is K.O.'d and Toki stays", () => {
    const g = byOpponent([ID, RP], RP);
    decline(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([RP]);
  });

  it('a Character of a type merely including "Roger Pirates" ({Former Roger Pirates}) is covered; Toki herself too (no "other than")', () => {
    const g = byOpponent([ID], ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('a Character without a Roger Pirates type is not protected: no offer, K.O.', () => {
    const g = byOpponent([ID, V.c3], V.c3);
    expectDecision(g, 'main', 'p2');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c3]);
  });

  it('a K.O. in battle is not replaced', () => {
    const g = koedInBattle(RP, { leader: 'ST01-001', characters: [ID] });
    expect(idsOf(g, 'p1', 'trash')).toEqual([RP]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a K.O. by your own effect is not replaced', () => {
    const g = mine({ characters: [ID, SHANKS] }, {}, 6);
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    pick(g, [g.find('p1', 'characters', SHANKS)]);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([SHANKS]);
  });

  it("only a K.O. is replaced: the opponent's return to hand is not", () => {
    const g = mine({ characters: [ID, RP] }, {}, 6);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', RP)]);
    expectDecision(g, 'main', 'p2');
    expect(idsOf(g, 'p1', 'hand')).toEqual([RP]);
  });
});
