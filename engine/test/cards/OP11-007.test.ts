/** OP11-007 Tashigi. */
import { describe, expect, it } from 'vitest';
import { dec, pick, V } from './helpers.ts';
import {
  activate,
  canPick,
  mk,
  NAVY,
  NAVY_LEADER,
  offeredAb,
  pw,
  RED_LEADER,
} from './helpers-op11g1.ts';

const ID = 'OP11-007';
const chars = [ID, NAVY.c2, V.c1];

describe('OP11-007 Tashigi', () => {
  it('[Activate: Main]: rests; with a {Navy} Leader, a {Navy} Character gains +2000 power this turn', () => {
    const g = mk({ leader: NAVY_LEADER, characters: chars });
    activate(g, g.find('p1', 'characters', ID), 'boost');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', NAVY.c2))).toBe(true);
    pick(g, [g.find('p1', 'characters', NAVY.c2)]);
    expect(pw(g, 'p1', NAVY.c2)).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p1', NAVY.c2)).toBe(4000);
  });

  it('may target itself (a {Navy} Character), and the boost may be declined', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] });
    activate(g, g.find('p1', 'characters', ID), 'boost');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(pw(g, 'p1', ID)).toBe(3000);
    const h = mk({ leader: NAVY_LEADER, characters: chars });
    activate(h, h.find('p1', 'characters', ID), 'boost');
    h.act({ type: 'done' });
    expect(pw(h, 'p1', NAVY.c2)).toBe(4000);
  });

  it('without a {Navy} Leader the cost is still paid and nothing is boosted', () => {
    const g = mk({ leader: RED_LEADER, characters: chars });
    activate(g, g.find('p1', 'characters', ID), 'boost');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('main');
    expect(pw(g, 'p1', NAVY.c2)).toBe(4000);
  });

  it('cannot be activated while rested', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [{ card: ID, rested: true }] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'boost')).toBe(false);
  });
});
