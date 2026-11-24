/** EB05-022 Octopako. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, game, hand, passBlock, PLAIN_BLUE, V } from './helpers.ts';

const OCTO = 'EB05-022';

describe('EB05-022 Octopako', () => {
  it("[On K.O.] draws 2 when K.O.'d in battle", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [{ card: OCTO, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', OCTO),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([OCTO]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it("does not draw while it is not K.O.'d (the attack goes to the Leader)", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [OCTO] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it("an opposing Octopako K.O.'d draws for its owner only", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { leader: PLAIN_BLUE, characters: [{ card: OCTO, rested: true }] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c7),
      target: g.find('p2', 'characters', OCTO),
    });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toHaveLength(2);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
