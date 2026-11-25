/** OP10-095 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canAccept,
  canPick,
  dec,
  decline,
  DRESS_LEADER,
  DRESS_STAGE,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-095';
const start = (p1: object = {}) =>
  mk(
    { leader: DRESS_LEADER, hand: [ID], deck: [V.c4, V.c5, V.c6], ...p1 },
    { characters: [V.c3, V.c4, V.c5] },
  );

describe('OP10-095 Roronoa Zoro', () => {
  it('[On Play] rest your Dressrosa Leader: K.O. a Character with cost 4 or less, then trash 2 from the deck', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c3, V.c5]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5, V.c4]);
  });

  it('the rested card may be a Dressrosa Stage', () => {
    const g = start({ leader: OTHER_LEADER, stage: DRESS_STAGE });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('"up to 1": no K.O. still trashes 2 cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5, V.c4]);
  });

  it('declining the cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('must not fire without a Dressrosa Leader or Stage', () => {
    const g = start({ leader: OTHER_LEADER });
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });
});
