/** OP15-027 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, expectDecision, none, pick, play } from './helpers.ts';
import { choices, mk } from './helpers-w4sa.ts';

const ID = 'OP15-027';

describe('OP15-027 Dracule Mihawk', () => {
  const start = (chars: unknown[] = [{ card: BLUE, don: 1 }, PURPLE, { card: V.c2, don: 3 }]) =>
    mk({ hand: [ID], leader: 'ST03-001' }, { characters: chars as never });

  it('offers only opposing Characters with a DON!! card given, and rests the chosen one', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.find('p2', 'characters', BLUE), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', BLUE)]);
    expect(g.card(g.find('p2', 'characters', BLUE)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('exactly 1 DON!! given is enough (boundary), 0 is not', () => {
    const g = start([{ card: BLUE, don: 1 }, PURPLE]);
    play(g, ID);
    expect(choices(g)).toEqual([g.find('p2', 'characters', BLUE)]);
  });

  it('"up to 1": nothing may be chosen', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('must not fire on your own Characters or with no Character holding a DON!! (no state change)', () => {
    const g = mk(
      { hand: [ID], characters: [{ card: BLUE, don: 1 }], costArea: { active: 9, rested: 0 } },
      { characters: [PURPLE] },
    );
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', BLUE)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
  });
});
