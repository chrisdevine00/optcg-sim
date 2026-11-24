/** OP14-043 Aladine. */
import { describe, expect, it } from 'vitest';
import { hand, none, pick, play, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { canPick, FM3, FM4, FM_LEADER, MER3, mine } from './helpers-op14g2.ts';
import { koOf } from './helpers-op15g3.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';

const ID = 'OP14-043';

const start = (handCards: string[]) =>
  mine(FM_LEADER, { hand: [ID, ...handCards], costArea: { active: 4, rested: 0 } });

describe('OP14-043 Aladine', () => {
  it('[On Play]: plays a {Fish-Man} or {Merfolk} Character with cost 3 or less from hand', () => {
    const g = start([FM3, MER3, FM4, V.c1]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', FM3))).toBe(true); // cost 3: boundary in
    expect(canPick(g, g.find('p1', 'hand', MER3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', FM4))).toBe(false); // cost 4: out
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // wrong type
    pick(g, [g.find('p1', 'hand', MER3)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ID, MER3].sort());
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('[On Play]: "up to 1": may play nothing', () => {
    const g = start([FM3]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[On K.O.]: draws 1 card', () => {
    const g = mine(FM_LEADER, { characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    koOf(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('must not draw when it leaves the field without being K.O.d', () => {
    const g = mine(FM_LEADER, { characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(g, {
      move: { what: { from: 'characters', owner: 'opponent' }, to: { zone: 'hand' } },
    });
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
