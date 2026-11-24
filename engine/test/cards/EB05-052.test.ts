/** EB05-052 Gloriosa. */
import { describe, expect, it } from 'vitest';
import { withKeywords } from '../../src/testing.ts';
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
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';

const ID = 'EB05-052';

describe('EB05-052 Gloriosa', () => {
  /** p1's 9000 Character attacks p2's Leader; p2 has Gloriosa on the field. */
  const attack = (p2: { characters?: string[]; life?: string[]; hand?: string[] } = {}) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      {
        leader: PLAIN_BLUE,
        characters: [ID],
        life: [BLUE, BLUE, BLUE],
        hand: [BLUE, BLUE],
        ...p2,
      },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    return g;
  };

  it('battle damage: you may trash this Character instead; no Life card is taken', () => {
    const g = attack();
    expectDecision(g, 'optional', 'p2');
    g.act({ type: 'optional', accept: true });
    expect(g.zone('p2', 'life')).toHaveLength(3);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([ID]);
    expect(hand(g, 'p2')).toHaveLength(2);
  });

  it('declining takes the damage as usual and keeps Gloriosa', () => {
    const g = attack();
    g.act({ type: 'optional', accept: false });
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p2', 'life')).toHaveLength(2);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a Double Attack hit is one damage: one trash stops both Life cards', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { leader: PLAIN_BLUE, characters: [ID], life: [BLUE, BLUE, BLUE] },
    );
    g.state = withKeywords(g.state, V.c7, ['Double Attack']);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    g.act({ type: 'optional', accept: true });
    expect(g.zone('p2', 'life')).toHaveLength(3);
    expect(g.eventsOfType('ReplacementApplied')).toHaveLength(1);
  });

  it('must not fire for damage to the other player, nor when Gloriosa is not on the field', () => {
    // p2 hits p1, who has no Gloriosa: p1 takes the damage with no offer.
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], life: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expect(dec(g)?.kind).toBe('trigger'); // Gloriosa in hand replaces nothing
    expect(g.eventsOfType('ReplacementApplied')).toHaveLength(0);
  });

  it('[Trigger]: draw 2 cards and trash 1 card from your hand', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      {
        leader: PLAIN_BLUE,
        life: [ID, BLUE, BLUE],
        hand: [V.c1],
        deck: [V.c2, V.c3, V.c4],
      },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p2');
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p2')).toHaveLength(3); // 1 + 2 drawn, the trash is still to choose
    pick(g, [g.find('p2', 'hand', V.c1)]);
    expect(hand(g, 'p2')).toHaveLength(2); // 1 + 2 drawn - 1 trashed
    expect(trash(g, 'p2')).toHaveLength(2); // Gloriosa and the trashed card
  });
});
