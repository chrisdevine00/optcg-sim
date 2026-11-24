/** OP12-003 Crocus. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, expectDecision, none, pick } from './helpers.ts';
import { at, BLUE_3000, choices, EVENTS, mk, RED_3000, SHC } from './helpers-op12g1.ts';

const ID = 'OP12-003';
const RED_4000 = SHC.jinbe2;

describe('OP12-003 Crocus', () => {
  const start = (hand: string[] = [...EVENTS, RED_3000, RED_4000, BLUE_3000]) =>
    mk({ characters: [ID], hand });
  const ko = (g: ReturnType<typeof start>) => {
    g.state = applyOp(g.state, { op: 'ko', card: at(g, 'p1', 'characters', ID), by: 'p2' }).state;
  };

  it('[On K.O.]: reveal 2 Events: plays up to 1 red Character with 3000 power or less from the hand', () => {
    const g = start();
    ko(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
    expectDecision(g, 'choose', 'p1');
    // Boundary: the 3000 red Character only (not the 4000 red one, not the blue 3000 one).
    expect(choices(g)).toEqual([g.find('p1', 'hand', RED_3000)]);
    pick(g, [g.find('p1', 'hand', RED_3000)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([RED_3000]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual(
      expect.arrayContaining([...EVENTS, RED_4000, BLUE_3000]),
    );
  });

  it('declining the optional cost plays nothing', () => {
    const g = start();
    ko(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand')).toHaveLength(5);
  });

  it('with fewer than 2 Events in hand the cost cannot be paid (accept is not legal)', () => {
    const g = start([EVENTS[0], RED_3000]);
    ko(g);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"up to 1": after revealing, the play may be skipped', () => {
    const g = start();
    ko(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('must not fire when it is not K.O.d: trashed by an effect leaves it alone', () => {
    const g = start();
    g.state = applyOp(g.state, {
      op: 'trashFromField',
      card: at(g, 'p1', 'characters', ID),
      by: 'p2',
    }).state;
    expect(dec(g)?.kind).toBe('main');
  });
});
