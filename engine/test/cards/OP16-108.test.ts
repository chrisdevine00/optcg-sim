/** OP16-108 Shiryu. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { BB_10, BB_5, names, OTHER_LEADER, trig } from './helpers-op16g4.ts';

const ID = 'OP16-108';

const start = (trash: string[], h: string[] = [V.c5]) =>
  game(
    { leader: PLAIN_BLUE, hand: [ID, ...h], trash, costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-108 Shiryu', () => {
  it('[On Play] trash 1 card from hand: adds a {Blackbeard Pirates} card (cost 6 or less) from the trash to the top of your Life face-up', () => {
    const g = start([BB_5, V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    pick(g, [g.find('p1', 'trash', BB_5)]);
    const life = g.zone('p1', 'life');
    expect(life).toHaveLength(4);
    expect(life[0]!.card).toBe(BB_5);
    expect(life[0]!.faceUp).toBe(true);
    expect(names(g, 'p1', 'trash').sort()).toEqual([V.c5, V.c2].sort());
  });

  it('must not add a cost 10 {Blackbeard Pirates} card or a card of another type', () => {
    const g = start([BB_10, V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the optional cost: nothing is trashed, nothing added', () => {
    const g = start([BB_5]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c5]);
    expect(g.life('p1')).toBe(3);
  });

  it('cannot be paid with an empty hand; "up to 1" may add nothing', () => {
    const g = start([BB_5], []);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    const g2 = start([BB_5]);
    play(g2, ID);
    accept(g2);
    pick(g2, [g2.find('p1', 'hand', V.c5)]);
    none(g2);
    expect(g2.life('p1')).toBe(3);
  });

  it('[Trigger] draws 2 cards', () => {
    const g = trig(ID, { leader: OTHER_LEADER, deck: [V.c1, V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });
});
