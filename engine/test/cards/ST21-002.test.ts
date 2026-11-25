/** ST21-002 Usopp. */
import { describe, expect, it } from 'vitest';
import { mk, oppTurn } from './helpers-st1821.ts';

const ID = 'ST21-002';
const FIVE = { active: 5, rested: 0 };

describe('ST21-002 Usopp', () => {
  it("[DON!! x2] [Opponent's Turn]: +2000 power on the opponent's turn (3000 becomes 5000)", () => {
    const g = mk({ characters: [{ card: ID, don: 2 }], costArea: FIVE }, {}, oppTurn);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('boundary: 1 DON!! given gives no bonus on the opponent turn', () => {
    const g = mk({ characters: [{ card: ID, don: 1 }], costArea: FIVE }, {}, oppTurn);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
  });

  it('on your own turn there is no +2000 (only the +1000 per DON!! given)', () => {
    const g = mk({ characters: [{ card: ID, don: 2 }], costArea: FIVE });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    const h = mk({ characters: [{ card: ID, don: 3 }], costArea: FIVE });
    expect(h.power(h.find('p1', 'characters', ID))).toBe(6000);
  });

  it('with no DON!! it is the printed 3000 on both turns', () => {
    const own = mk({ characters: [ID] });
    expect(own.power(own.find('p1', 'characters', ID))).toBe(3000);
    const opp = mk({ characters: [ID] }, {}, oppTurn);
    expect(opp.power(opp.find('p1', 'characters', ID))).toBe(3000);
  });

  it('the bonus applies to this Character only', () => {
    const g = mk({ characters: [{ card: ID, don: 2 }, 'OP02-084'], costArea: FIVE }, {}, oppTurn);
    expect(g.power(g.find('p1', 'characters', 'OP02-084'))).toBe(3000);
  });
});
