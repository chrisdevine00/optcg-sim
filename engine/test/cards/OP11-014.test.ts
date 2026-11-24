/** OP11-014 Borsalino. */
import { describe, expect, it } from 'vitest';
import { dec, pick, V } from './helpers.ts';
import {
  activate,
  canHit,
  canPick,
  mk,
  NAVY,
  NAVY_LEADER,
  offeredAb,
  RED_LEADER,
} from './helpers-op11g1.ts';

const ID = 'OP11-014';

describe('OP11-014 Borsalino', () => {
  it('[Activate: Main]: rests; a {Navy} Character can also attack active Characters this turn', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID, NAVY.c2, V.c1] }, { characters: [V.c4] });
    const active = g.find('p2', 'characters', V.c4);
    expect(canHit(g, g.find('p1', 'characters', NAVY.c2), active)).toBe(false);
    activate(g, g.find('p1', 'characters', ID), 'attack-active');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // not {Navy}
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', NAVY.c2))).toBe(true);
    pick(g, [g.find('p1', 'characters', NAVY.c2)]);
    expect(canHit(g, g.find('p1', 'characters', NAVY.c2), active)).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', NAVY.c2), g.leader('p2'))).toBe(true);
    expect(canHit(g, g.leader('p1'), active)).toBe(false); // only the one chosen
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canHit(g, g.find('p1', 'characters', NAVY.c2), active)).toBe(false);
  });

  it('a {Navy} Leader can be the one chosen', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, { characters: [V.c4] });
    activate(g, g.find('p1', 'characters', ID), 'attack-active');
    pick(g, [g.leader('p1')]);
    expect(canHit(g, g.leader('p1'), g.find('p2', 'characters', V.c4))).toBe(true);
  });

  it('"up to 1": may choose nobody', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID, NAVY.c2] }, { characters: [V.c4] });
    activate(g, g.find('p1', 'characters', ID), 'attack-active');
    g.act({ type: 'done' });
    expect(canHit(g, g.find('p1', 'characters', NAVY.c2), g.find('p2', 'characters', V.c4))).toBe(
      false,
    );
  });

  it('with a non-{Navy} Leader and no other {Navy} card, only Borsalino himself qualifies (rested, so no attack)', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, V.c1] });
    activate(g, g.find('p1', 'characters', ID), 'attack-active');
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('cannot be activated while rested', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [{ card: ID, rested: true }] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'attack-active')).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });
});
