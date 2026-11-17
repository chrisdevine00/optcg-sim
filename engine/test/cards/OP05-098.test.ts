/** OP05-098 Enel (Leader). RL-42, QA-OP05 OP05-098 (four rows), QA-OP11 OP11-102. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  PURPLE,
  takeDamage,
  V,
} from './helpers.ts';
import { ENEL, ids, TRIG } from './helpers-robin.ts';

/** p2 (turn 4) has two attackers; p1 is Enel with `life` Life cards. */
const position = (life: string[], handCards: string[]) =>
  game(
    { leader: ENEL, life, hand: handCards, deck: [PURPLE, PURPLE, PURPLE] },
    { leader: PLAIN_BLUE, characters: [V.c7, V.c6] },
    { turn: 4, activePlayer: 'p2' },
  );
const hit = (g: ReturnType<typeof position>, attacker: string) => {
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('OP05-098 Enel', () => {
  it('when the last Life card is taken on the opponent turn: add 1 from the deck to Life, then trash 1 from hand', () => {
    const g = position([BLUE], [PURPLE, V.c1]);
    hit(g, V.c7);
    // The damage put the Life card in hand; then Enel's effect.
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE, V.c1].sort());
    // Mandatory (CR 8-1-2): no "use this effect?" question, the card is added.
    expect(g.life('p1')).toBe(1);
    expect(ids(g, 'p1', 'life')).toEqual([PURPLE]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
    expectDecision(g, 'main', 'p2');
  });

  it('M4b-01: the add is mandatory (no "may"): it is not offered as optional, and the discard follows', () => {
    const g = position([BLUE], [V.c1]);
    hit(g, V.c7);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.life('p1')).toBe(1);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('Once Per Turn: the second time Life reaches 0 in a turn nothing happens', () => {
    const g = position([BLUE], [PURPLE]);
    hit(g, V.c7);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(g.life('p1')).toBe(1);
    // The next hit takes the new Life card: Life is 0 again, but the ability was used this turn.
    hit(g, V.c6);
    expect(g.life('p1')).toBe(0);
    expectDecision(g, 'main', 'p2');
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
  });

  it('QA-OP05 OP05-098: with a [Trigger] on the last Life card the [Trigger] decision comes first, then Enel', () => {
    const g = game(
      { leader: ENEL, life: [TRIG], hand: [V.c1], deck: [PURPLE, PURPLE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1').sort()).toEqual([TRIG, V.c1].sort());
    expect(g.life('p1')).toBe(1);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.life('p1')).toBe(1);
  });

  it('with an empty hand "trash 1 card" does nothing', () => {
    const g = position([PURPLE], []);
    hit(g, V.c7);
    // The Life card is in hand now, so Enel's trash has a card to take: take it back out.
    expect(g.life('p1')).toBe(1);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('does not trigger while Life stays above 0', () => {
    const g = position([BLUE, BLUE], [PURPLE]);
    hit(g, V.c7);
    expectDecision(g, 'main', 'p2');
    expect(g.life('p1')).toBe(1);
  });
});
