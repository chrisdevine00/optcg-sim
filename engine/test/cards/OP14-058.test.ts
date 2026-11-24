/** OP14-058 Ocean Current Shoulder Throw. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  hand,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import { cardsOf, counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, FM3, FM4, FM_LEADER, mine, MER3 } from './helpers-op14g2.ts';

const ID = 'OP14-058';
/** A 6000-power Character (cost 4) and a 7000 one, both vanillas. */
const P6000 = V.c4;
const P7000 = V.c5;

const start = (oppChars: string[] = [P6000, P7000], handCards: string[] = [FM3, FM4, MER3]) =>
  mine(
    FM_LEADER,
    { hand: [ID, ...handCards], characters: [V.c1], costArea: { active: 5, rested: 0 } },
    { characters: oppChars },
  );

describe('OP14-058 Ocean Current Shoulder Throw', () => {
  it('[Main]: rest 3 DON!!: play a {Fish-Man} Character cost 3 or less, then return a 6000 base power Character', () => {
    const g = start();
    play(g, ID); // costs 2
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(canPick(g, g.find('p1', 'hand', FM3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', FM4))).toBe(false); // cost 4: out
    expect(canPick(g, g.find('p1', 'hand', MER3))).toBe(false); // {Merfolk}, not {Fish-Man}
    pick(g, [g.find('p1', 'hand', FM3)]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', P6000))).toBe(true); // exactly 6000
    expect(canPick(g, g.find('p2', 'characters', P7000))).toBe(false); // 7000: not 6000
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // 3000
    pick(g, [g.find('p2', 'characters', P6000)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([P7000]);
    expect(cardsOf(g, 'p2', 'hand')).toContain(P6000);
  });

  it('with no Character of exactly 6000 base power anywhere, nothing is returned', () => {
    const g = start([P7000], [FM3]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', FM3)]);
    // No 6000 Character anywhere: the return finds nothing, so nothing is asked.
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([P7000]);
  });

  it('declining the cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([V.c1]);
    expect(cardsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  describe('[Counter]', () => {
    it('draws 1 card and your Leader gains +3000 during this battle', () => {
      const g = counterStep({
        leader: FM_LEADER,
        hand: [ID],
        costArea: { active: 2, rested: 0 },
      });
      useCounter(g, ID);
      expect(hand(g, 'p1')).toHaveLength(1);
      expect(g.power(g.leader('p1'))).toBe(8000);
      endCounter(g);
      takeDamage(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});
