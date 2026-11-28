/** OP18-019 Quack!!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { withDon } from './helpers-op14g1.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { mk, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-019';

describe('OP18-019 Quack!!!', () => {
  it('[Main] with no Character of 7000 base power or more: an opponent Character gets -3000 power', () => {
    const g = mk({ hand: [ID], characters: [V.c4] }, { characters: [V.c4] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
  });

  it('boundary: 6000 base power does not block it, even with DON!! given (current 7000)', () => {
    const g = mk({ hand: [ID], characters: [withDon(V.c4, 1)] }, { characters: [V.c1] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('a Character with 7000 base power stops the effect: nothing is asked', () => {
    const g = mk({ hand: [ID], characters: [V.c5] }, { characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});
