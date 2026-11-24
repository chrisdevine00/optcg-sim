/** EB05-009 Fight and Die with Me!!!. */
import { describe, expect, it } from 'vitest';
import { endCounter, game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { counterStep, SHC, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'EB05-009';

describe('EB05-009 Fight and Die with Me!!!', () => {
  const main = (hand: string[] = []) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID, ...hand],
        characters: [V.c1, V.c2, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c2] },
    );

  it("[Main]: all of your Characters with 4000 base power or less gain +1000 power until the end of your opponent's next End Phase", () => {
    const g = main();
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(5000);
    // 6000 base power: not included.
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
    // The opponent's Character and the Leader are not affected.
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('a Character with 4000 base power but extra power from DON!! still counts by its base power', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        characters: [{ card: V.c2, don: 1 }],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    // 4000 base + 1000 DON!! + 1000 effect.
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(6000);
  });

  it('a Character played afterwards does not gain the power', () => {
    const g = main([V.c1]);
    play(g, ID);
    play(g, V.c1);
    const fresh = g.zone('p1', 'characters').filter((c) => c.card === V.c1);
    expect(fresh.map((c) => g.power(c.instance)).sort()).toEqual([3000, 4000]);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      {
        leader: SHC_LEADER,
        hand: [ID],
        characters: [SHC.franky4],
        costArea: { active: 1, rested: 0 },
      },
      {},
      V.c5,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    // The Character is untouched by the Counter.
    expect(g.power(g.find('p1', 'characters', SHC.franky4))).toBe(6000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 beats the 7000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
