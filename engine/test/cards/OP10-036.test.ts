/** OP10-036 Perona. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, pick, setMost, V } from './helpers.ts';
import { mk, oppRuns, restedCard, runMine, runMineCost } from './helpers-a10g2.ts';

const ID = 'OP10-036';
const restOpp = { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const restMine = { rest: { from: 'characters', owner: 'you', pick: { upTo: 1 } } };

describe('OP10-036 Perona', () => {
  const start = () =>
    mk(
      { characters: [ID, V.c1], costArea: { active: 4, rested: 3 } },
      { characters: [V.c2, restedCard(V.c3)] },
    );

  it('[Your Turn] a Character rested by your effect: sets up to 1 of your DON!! as active', () => {
    const g = start();
    runMine(g, restOpp);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2 });
    expectDecision(g, 'main', 'p1');
  });

  it('works on your own Character rested by your effect too (a Character of either player)', () => {
    const g = start();
    runMine(g, restMine);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2 });
  });

  it('"up to 1": may set none', () => {
    const g = start();
    runMine(g, restOpp);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });

  it('[Once Per Turn]: a second Character rested by your effect the same turn sets nothing', () => {
    const g = start();
    runMine(g, restMine);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    setMost(g);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'planted' });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2 });
  });

  it('must not fire when the rest is a cost, or the card is already rested, or it is a Leader', () => {
    // A rest paid as a cost is not "rested by your effect".
    const a = start();
    runMineCost(
      a,
      [
        {
          rest: {
            from: 'characters',
            owner: 'you',
            filter: { isSelf: false },
            pick: { exactly: 1 },
          },
        },
      ],
      { draw: 0 },
    );
    while (dec(a)?.kind === 'choose' || dec(a)?.kind === 'optional') {
      if (dec(a)?.kind === 'optional') a.act({ type: 'optional', accept: true });
      else pick(a, [a.find('p1', 'characters', V.c1)]);
    }
    expect(a.card(a.find('p1', 'characters', V.c1)).rested).toBe(true);
    expect(don(a, 'p1')).toMatchObject({ active: 4, rested: 3 });
    // An already rested Character is not rested again.
    const b = mk(
      { characters: [ID], costArea: { active: 4, rested: 3 } },
      { characters: [restedCard(V.c3)] },
    );
    runMine(b, restOpp);
    if (dec(b)?.kind === 'choose') pick(b, [b.find('p2', 'characters', V.c3)]);
    expect(dec(b)?.kind).toBe('main');
    expect(don(b, 'p1')).toMatchObject({ active: 4, rested: 3 });
    // A Leader is not a Character.
    const c = start();
    runMine(c, { rest: { from: 'leader', owner: 'opponent' } });
    expect(dec(c)?.kind).toBe('main');
    expect(don(c, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });

  it("must not fire on the opponent's turn (their effect resting your Character)", () => {
    const g = mk(
      { characters: [ID, V.c1], costArea: { active: 4, rested: 3 } },
      { characters: [V.c2] },
      { turn: 4, activePlayer: 'p2' },
    );
    oppRuns(g, { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });
});
