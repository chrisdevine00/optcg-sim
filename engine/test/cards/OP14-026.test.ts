/** OP14-026 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-026';
const power = (g: ReturnType<typeof mk>) => g.power(g.find('p1', 'characters', ID));

describe('OP14-026 Kouzuki Oden', () => {
  it("[Opponent's Turn]: rested, he gains +2000 power", () => {
    const g = mk({ characters: [restedCard(ID)] }, {}, { turn: 4, activePlayer: 'p2' });
    expect(power(g)).toBe(7000);
  });

  it('must not apply while active on the opponent turn', () => {
    const g = mk({ characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    expect(power(g)).toBe(5000);
  });

  it('must not apply on your own turn, even rested', () => {
    const g = mk({ characters: [restedCard(ID)] });
    expect(power(g)).toBe(5000);
  });

  it('given DON!! add nothing on the opponent turn: 5000 + 2000', () => {
    const g = mk(
      { characters: [{ card: ID, don: 2, rested: true }], costArea: { active: 5, rested: 0 } },
      {},
      {
        turn: 4,
        activePlayer: 'p2',
      },
    );
    expect(power(g)).toBe(7000);
  });

  it('on your own turn the 2 given DON!! add +2000 and rested adds nothing else: 7000', () => {
    const g = mk({
      characters: [{ card: ID, don: 2, rested: true }],
      costArea: { active: 5, rested: 0 },
    });
    expect(power(g)).toBe(7000);
  });
});
