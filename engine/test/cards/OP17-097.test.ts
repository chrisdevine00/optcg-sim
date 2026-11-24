/** OP17-097 I'll Feed on This Rage and Use It to Bring the World to Ruin!!! */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  passBlock,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';

const ID = 'OP17-097';

describe("OP17-097 I'll Feed on This Rage and Use It to Bring the World to Ruin!!!", () => {
  const main = () =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], characters: [V.c4], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c5, V.c1] },
    );

  it("[Main] gives all of your opponent's Characters −1 cost during this turn", () => {
    const g = main();
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(4);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(0);
  });

  it('does not change your own Characters', () => {
    const g = main();
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', V.c4)).cost).toBe(4);
  });

  it('lasts through this turn only: the cost is back at the start of the next turn', () => {
    const g = main();
    play(g, ID);
    g.act({ type: 'endTurn' });
    // The opponent's turn begins: their Characters have their own costs again.
    while (g.decider === 'p1' && g.legal().length === 1) g.act(g.legal()[0]!);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 stops the 7000 attacker
  });
});
