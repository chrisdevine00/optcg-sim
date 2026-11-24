/** OP14-047 Shirahoshi. */
import { describe, expect, it } from 'vitest';
import { hand, none, pick, play, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { canPick, FM3, FM4, FM_LEADER, MER3, mine } from './helpers-op14g2.ts';

const ID = 'OP14-047';

const start = (handCards: string[]) =>
  mine(FM_LEADER, { hand: [ID, ...handCards], costArea: { active: 8, rested: 0 } });

describe('OP14-047 Shirahoshi', () => {
  it('[On Play]: draws 1, then plays a {Fish-Man} or {Merfolk} Character with cost 3 or less from hand', () => {
    const g = start([FM3, FM4, V.c1]);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(4); // 3 + 1 drawn
    expect(canPick(g, g.find('p1', 'hand', FM3))).toBe(true); // cost 3: in
    expect(canPick(g, g.find('p1', 'hand', FM4))).toBe(false); // cost 4: out
    pick(g, [g.find('p1', 'hand', FM3)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([FM3, ID].sort());
  });

  it('the drawn card is already in hand when the play is chosen (a {Merfolk} drawn can be played)', () => {
    const g = mine(FM_LEADER, {
      hand: [ID],
      deck: [MER3, V.c1, V.c1],
      costArea: { active: 8, rested: 0 },
    });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', MER3))).toBe(true);
    pick(g, [g.find('p1', 'hand', MER3)]);
    expect(cardsOf(g, 'p1', 'characters')).toContain(MER3);
  });

  it('"up to 1": may play nothing; the draw still happens', () => {
    const g = start([FM3]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('is a [Blocker]', () => {
    const g = mine(
      FM_LEADER,
      { characters: [ID] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
  });
});
