/** OP11-012 Franky. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, passBlock } from './helpers.ts';
import { donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP11-012';
const EVENT = 'OP12-038'; // [Counter] Your Leader gains +3000 power during this battle (cost 1)

describe('OP11-012 Franky', () => {
  /** p1 attacks p2's Leader; p2 is at the Counter Step holding `events` Events. */
  const start = () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID, { card: SHC.sanji1 }, SHC.franky4] },
      { leader: PLAIN_BLUE, hand: [EVENT, EVENT], ...donArea(2) },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', SHC.franky4),
      target: g.leader('p2'),
    });
    passBlock(g);
    expectDecision(g, 'counter', 'p2');
    return g;
  };
  const counter = (g: ReturnType<typeof start>, nth: number) =>
    g.act({ type: 'activate', card: g.find('p2', 'hand', EVENT, nth), ability: 'counter' });

  it('[Your Turn] [Once Per Turn]: when your opponent activates an Event, all your Characters gain +2000 power', () => {
    const g = start();
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    counter(g, 0);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', SHC.sanji1))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', SHC.franky4))).toBe(8000);
    // The Leader is not a Character.
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second Event the same turn adds nothing', () => {
    const g = start();
    counter(g, 0);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expectDecision(g, 'counter', 'p2');
    counter(g, 0);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('the boost lasts for the turn, not just the battle', () => {
    const g = start();
    counter(g, 0);
    g.act({ type: 'endCounter' });
    // Battle over (the Leader was boosted past 5000? it is 8000 vs 8000: the attacker wins ties).
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it("does not fire on your own Event, or on the opponent's turn", () => {
    // p1 activates an Event on its own Main Phase.
    const own = game(
      { leader: SHC_LEADER, characters: [ID], hand: [EVENT], ...donArea(1) },
      { leader: PLAIN_BLUE },
    );
    own.act({ type: 'playCard', card: own.find('p1', 'hand', EVENT) });
    expect(own.power(own.find('p1', 'characters', ID))).toBe(4000);
    // On p2's turn p1 counters with its own Event: it is "your Turn" only.
    const theirs = game(
      { leader: SHC_LEADER, characters: [ID], hand: [EVENT], ...donArea(1) },
      { leader: PLAIN_BLUE, characters: [SHC.franky4] },
      { turn: 4, activePlayer: 'p2' },
    );
    theirs.act({
      type: 'attack',
      attacker: theirs.find('p2', 'characters', SHC.franky4),
      target: theirs.leader('p1'),
    });
    passBlock(theirs);
    theirs.act({ type: 'activate', card: theirs.find('p1', 'hand', EVENT), ability: 'counter' });
    expect(theirs.power(theirs.find('p1', 'characters', ID))).toBe(4000);
  });
});
