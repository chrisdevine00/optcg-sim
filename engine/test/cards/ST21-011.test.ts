/** ST21-011 Franky. */
import { describe, expect, it } from 'vitest';
import { BLUE } from './helpers.ts';
import { SHC_4000, SHC_5000, boost, mk, oppTurn } from './helpers-st1821.ts';

const ID = 'ST21-011';
const FIVE = { active: 5, rested: 0 };

/** p1 has Franky (4000 base) and {SHC} 4000 / 5000 base Characters and a Blue non-{SHC} one. */
const start = (don: number, extra: Parameters<typeof mk>[2] = oppTurn) =>
  mk({ characters: [{ card: ID, don }, SHC_4000, SHC_5000, BLUE], costArea: FIVE }, {}, extra);
const pw = (g: ReturnType<typeof start>, card: string) => g.power(g.find('p1', 'characters', card));

describe('ST21-011 Franky', () => {
  it("[DON!! x2] [Opponent's Turn]: your {Straw Hat Crew} Characters with 4000 base power or less gain +1000", () => {
    const g = start(2);
    expect(pw(g, ID)).toBe(5000); // Franky himself (4000 base)
    expect(pw(g, SHC_4000)).toBe(5000);
    // 5000 base is over the limit; a Blue non-{SHC} Character is not affected.
    expect(pw(g, SHC_5000)).toBe(5000);
    expect(pw(g, BLUE)).toBe(3000);
  });

  it('boundary: 1 DON!! given gives no bonus', () => {
    const g = start(1);
    expect(pw(g, ID)).toBe(4000);
    expect(pw(g, SHC_4000)).toBe(4000);
  });

  it('on your own turn there is no bonus (the DON!! add +1000 each to Franky only)', () => {
    const g = start(2, {});
    expect(pw(g, ID)).toBe(6000);
    expect(pw(g, SHC_4000)).toBe(4000);
  });

  it('the limit is base power: a 4000-base Character buffed above 4000 still gets +1000', () => {
    const g = start(2);
    boost(g, g.find('p1', 'characters', SHC_4000), 2000, 4);
    expect(pw(g, SHC_4000)).toBe(7000);
  });

  it('a 5000-base Character never qualifies, even when lowered to 4000', () => {
    const g = start(2);
    boost(g, g.find('p1', 'characters', SHC_5000), -1000, 4);
    expect(pw(g, SHC_5000)).toBe(4000);
  });
});
