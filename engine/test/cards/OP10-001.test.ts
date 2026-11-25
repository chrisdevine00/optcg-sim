/** OP10-001 Smoker (Leader). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, option, V } from './helpers.ts';
import { activate, boost, mk, NAVY, OPP, offeredAb, PH } from './helpers-a10g1.ts';

const ID = 'OP10-001';
const start = (
  chars: (string | { card: string; don?: number })[] = [],
  p2chars: string[] = [],
  extra = {},
) =>
  mk(
    { leader: ID, characters: chars, costArea: { active: 2, rested: 3 } },
    { characters: p2chars },
    extra,
  );

describe('OP10-001 Smoker', () => {
  it("[Opponent's Turn]: your {Navy} and {Punk Hazard} Characters gain +1000 power", () => {
    const g = start([NAVY.c1, PH.c2, V.c1], [], OPP);
    expect(g.power(g.find('p1', 'characters', NAVY.c1))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', PH.c2))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000); // neither type
    expect(g.power(g.leader('p1'))).toBe(5000); // Characters only
  });

  it("must not boost on your own turn, nor the opponent's Characters", () => {
    const g = start([NAVY.c1, PH.c2], [NAVY.c1]);
    expect(g.power(g.find('p1', 'characters', NAVY.c1))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', PH.c2))).toBe(3000);
    const h = start([], [NAVY.c1], OPP);
    expect(h.power(h.find('p2', 'characters', NAVY.c1))).toBe(3000);
  });

  it('[Activate: Main] [Once Per Turn]: with a Character of 7000 power or more, sets up to 2 DON!! as active', () => {
    const g = start([V.c5]);
    activate(g, g.leader('p1'), 'set-don');
    expectDecision(g, 'choose', 'p1');
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expect(offeredAb(g, g.leader('p1'), 'set-don')).toBe(false); // once per turn
  });

  it('"up to 2": 1 or none may be set', () => {
    const g = start([V.c5]);
    activate(g, g.leader('p1'), 'set-don');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    const h = start([V.c5]);
    activate(h, h.leader('p1'), 'set-don');
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('boundary: 6000 power is not enough (the ability is used, Once Per Turn spent, nothing set); 7000 current power with a buff or a given DON!! is', () => {
    const g = start([V.c4]);
    activate(g, g.leader('p1'), 'set-don');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
    expectDecision(g, 'main', 'p1');
    expect(offeredAb(g, g.leader('p1'), 'set-don')).toBe(false);

    const buffed = start([V.c4]);
    boost(buffed, buffed.find('p1', 'characters', V.c4), 1000);
    activate(buffed, buffed.leader('p1'), 'set-don');
    option(buffed, '2');
    expect(don(buffed, 'p1')).toMatchObject({ active: 4 });

    const given = start([{ card: V.c4, don: 1 }]);
    expect(given.power(given.find('p1', 'characters', V.c4))).toBe(7000);
    activate(given, given.leader('p1'), 'set-don');
    option(given, '2');
    expect(don(given, 'p1').active).toBe(4);
  });

  it("only your own Characters count: an opponent's 7000 Character does not", () => {
    const g = start([], [V.c5]);
    activate(g, g.leader('p1'), 'set-don');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });
});
