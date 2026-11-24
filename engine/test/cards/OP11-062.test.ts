/** OP11-062 Charlotte Katakuri (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  passBlock,
  payDon,
  takeDamage,
  times,
  V,
} from './helpers.ts';
import { known, mk } from './helpers-op11g2.ts';

const ID = 'OP11-062';
const oppDeck = [V.c3, V.c4, V.c5, ...times(5, V.c1)];
const start = (p1: object = {}) =>
  mk(
    { leader: ID, characters: [V.c7], costArea: { active: 5, rested: 0 }, ...p1 },
    { deck: oppDeck },
  );
const attackWithLeader = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

describe('OP11-062 Charlotte Katakuri (Leader)', () => {
  it("[When Attacking]: DON!! -1, look at the top card of your opponent's deck, then +1000 power during this battle", () => {
    const g = start();
    attackWithLeader(g);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 6 });
    expect(known(g, 'p1')['p2.deck.0']).toBe(V.c3);
    expect(g.power(g.leader('p1'))).toBe(6000);
    // The opponent's deck did not move.
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual(oppDeck);
    expect(known(g, 'p2')['p2.deck.0']).toBeUndefined(); // the opponent learns nothing of the card
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // during this battle only
  });

  it('declining the optional DON!! -1: nothing is looked at, no boost, no DON!! returned', () => {
    const g = start();
    attackWithLeader(g);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 5 });
    expect(known(g, 'p1')['p2.deck.0']).toBeUndefined();
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'block', 'p2');
  });

  it('must not be usable with no DON!! on the field (the DON!! -1 cannot be paid)', () => {
    const g = start({ costArea: { active: 0, rested: 0 } });
    attackWithLeader(g);
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[On Your Opponent's Attack]: the same effect when your Leader is attacked", () => {
    const g = mk(
      { leader: ID, costArea: { active: 3, rested: 0 } },
      { characters: [V.c7], deck: oppDeck },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    accept(g);
    payDon(g);
    expect(known(g, 'p1')['p2.deck.0']).toBe(V.c3);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("[Once Per Turn] is shared by both timings: a second attack on the opponent's turn is not offered it again", () => {
    const g = mk(
      { leader: ID, costArea: { active: 3, rested: 0 } },
      { characters: [V.c7, V.c6], deck: oppDeck },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    accept(g);
    payDon(g);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(don(g, 'p1')).toMatchObject({ deck: 8 }); // 7 in the DON!! deck + the 1 returned, and no second one
  });
});
