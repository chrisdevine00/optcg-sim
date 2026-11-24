/** OP13-100 Jewelry Bonney (Leader). */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, pick, play, V } from './helpers.ts';
import { canPick, mine, TRIG2, TRIG5 } from './helpers-op13g4.ts';
import { queries } from '@optcg/engine';

const ID = 'OP13-100';

describe('OP13-100 Jewelry Bonney', () => {
  const run = (hand: string[], rested = 2, active = 6) =>
    mine({ leader: ID, characters: [V.c1], hand }, {}, active, rested);

  it('when you play a Character with a [Trigger]: gives up to 2 rested DON!! to 1 Leader or Character', () => {
    const g = run([TRIG2]);
    play(g, TRIG2);
    addMost(g);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 2": the count may be less (asks 2, 1 or 0)', () => {
    const g = run([TRIG2]);
    play(g, TRIG2);
    const d = dec(g)!;
    expect(d.options).toHaveLength(3);
    g.act({ type: 'pick', choice: { option: d.options![1]!.id } });
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 1 });
  });

  it('a Character without a [Trigger] does not activate it', () => {
    const g = run([V.c1]);
    play(g, V.c1);
    expect(dec(g)?.kind).toBe('main');
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 0 });
  });

  it('Once Per Turn: a second Character with a [Trigger] gives nothing', () => {
    const g = run([TRIG2, TRIG5], 2, 8);
    play(g, TRIG2);
    addMost(g);
    pick(g, [g.leader('p1')]);
    play(g, TRIG5);
    expect(dec(g)?.kind).toBe('main');
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 2 });
  });

  it('the DON!! paid for the played Character are rested and can be given (no pre-rested DON!!)', () => {
    const g = run([TRIG2], 0, 2);
    play(g, TRIG2);
    expect(don(g, 'p1').rested).toBe(2);
    addMost(g);
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 2, rested: 0 });
  });
});
