/** OP13-094 York. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import { canPick, CD2, mine } from './helpers-op13g4.ts';

const ID = 'OP13-094';

describe('OP13-094 York', () => {
  const run = (chars: string[]) =>
    mine({ leader: PLAIN_PURPLE, hand: [ID], characters: chars }, {}, 1);

  it('[On Play] a {Celestial Dragons} Character gains +2000 power this turn', () => {
    const g = run([CD2, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', CD2)]);
    expect(g.power(g.find('p1', 'characters', CD2))).toBe(6000);
  });

  it('only {Celestial Dragons} Characters are offered (not the Leader, not other types, not York)', () => {
    const g = run([CD2, V.c1]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', CD2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false);
    none(g);
  });

  it('"up to 1": may choose none', () => {
    const g = run([CD2]);
    play(g, ID);
    none(g);
    expect(g.power(g.find('p1', 'characters', CD2))).toBe(4000);
  });

  it('no {Celestial Dragons} Character: nothing to choose', () => {
    const g = run([V.c1]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });
});
