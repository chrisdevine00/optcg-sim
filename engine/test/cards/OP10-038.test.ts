/** OP10-038 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, restedCard } from './helpers-a10g2.ts';

const ID = 'OP10-038';

/** Zoro's power on the opponent's turn (or on yours when `own`) with these p1 Characters. */
const power = (
  chars: NonNullable<Parameters<typeof mk>[0]>['characters'],
  own = false,
  p2chars: string[] = [],
) => {
  const g = mk(
    { characters: chars },
    { characters: p2chars },
    own ? {} : { turn: 4, activePlayer: 'p2' },
  );
  return g.power(g.find('p1', 'characters', ID));
};

describe('OP10-038 Roronoa Zoro', () => {
  it("[Opponent's Turn] with 2 or more rested Characters: +2000 power", () => {
    expect(power([ID, restedCard(V.c1), restedCard(V.c2)])).toBe(8000);
    expect(power([ID, restedCard(V.c1), restedCard(V.c2), restedCard(V.c3)])).toBe(8000);
  });

  it('boundary: 1 rested Character is not enough, 2 is', () => {
    expect(power([ID, restedCard(V.c1), V.c2])).toBe(6000);
    expect(power([ID, restedCard(V.c1), restedCard(V.c2)])).toBe(8000);
    expect(power([ID])).toBe(6000);
  });

  it('Zoro himself counts when he is rested', () => {
    expect(power([restedCard(ID), restedCard(V.c1)])).toBe(8000);
    expect(power([restedCard(ID), V.c1])).toBe(6000);
  });

  it('must not apply on your own turn', () => {
    expect(power([ID, restedCard(V.c1), restedCard(V.c2)], true)).toBe(6000);
  });

  it("the opponent's rested Characters and your rested Leader do not count", () => {
    expect(
      power(
        [ID, restedCard(V.c1)],
        false,
        [V.c1, V.c2].map((c) => c),
      ),
    ).toBe(6000);
    const g = mk(
      { leader: { card: 'ST01-001', rested: true }, characters: [ID, restedCard(V.c1)] },
      { characters: [restedCard(V.c1), restedCard(V.c2)] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });
});
