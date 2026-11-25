/** ST16-004 Shanks. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, V } from './helpers.ts';
import { cardsIn, mk } from './helpers-prbst.ts';

const ID = 'ST16-004';

describe('ST16-004 Shanks', () => {
  const start = (p2chars: (string | { card: string; rested: boolean })[]) =>
    mk({ hand: [ID], costArea: { active: 9, rested: 0 } }, { characters: p2chars });

  it("[On Play]: K.O.s one of the opponent's rested Characters (active ones are not candidates)", () => {
    const g = start([{ card: V.c3, rested: true }, V.c4, { card: V.c5, rested: true }]);
    play(g, ID);
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c5)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = start([{ card: V.c3, rested: true }]);
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('must not fire: with only active opponent Characters nothing is K.O.d', () => {
    const g = start([V.c3, V.c4]);
    play(g, ID);
    while (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });

  it('your own rested Characters are not candidates', () => {
    const g = mk(
      {
        hand: [ID],
        characters: [{ card: V.c1, rested: true }],
        costArea: { active: 9, rested: 0 },
      },
      { characters: [{ card: V.c3, rested: true }] },
    );
    play(g, ID);
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toEqual([g.find('p2', 'characters', V.c3)]);
  });
});
