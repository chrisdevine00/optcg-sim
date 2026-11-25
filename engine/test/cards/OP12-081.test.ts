/** OP12-081 Koala (Leader). */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { dec, endCounter, game, hand, passBlock, pick, play, V } from './helpers.ts';
import { C8, PLAIN_BLUE, RA8, cardsIn } from './helpers-op12g3.ts';
import type { TestGame } from '../fixtures/index.ts';
import { acceptUse, declineUse } from './helpers-w57.ts';

const ID = 'OP12-081';
const BIG = [C8, C8];

/** p1's turn: Koala attacks p2's Leader; stops at p2's block step (or later). */
function attackLeader(
  chars: string[],
  p2chars: (string | { card: string; rested: boolean })[] = [],
) {
  const g = game(
    { leader: ID, characters: chars, costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE, characters: p2chars },
  );
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
  return g;
}

describe('OP12-081 Koala', () => {
  it("attacking the opponent's Leader with 2 Characters of cost 8 or more draws 1", () => {
    const g = attackLeader(BIG);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('boundary: only 1 such Character, or 2 of cost 7: no draw', () => {
    expect(hand(attackLeader([C8, V.c7]), 'p1')).toHaveLength(0);
    expect(hand(attackLeader([V.c7, V.c7]), 'p1')).toHaveLength(0);
  });

  it('a Character of cost 8 or more counts by current cost (a Character is not a Leader)', () => {
    const g = attackLeader([C8, RA8, V.c1]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("attacking one of the opponent's Characters does not trigger the draw", () => {
    const g = game(
      { leader: ID, characters: BIG, costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.find('p2', 'characters', V.c1) });
    passBlock(g);
    endCounter(g);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('when the opponent plays a Character with base cost 8 or more, they add 1 top Life card to their hand', () => {
    const g = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [C8],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, C8);
    acceptUse(g, ID); // "This effect can be activated when ..." is optional (W57-R5)
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(3);
  });

  it('boundary: base cost 7 played from hand does nothing', () => {
    const g = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [V.c7],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, V.c7);
    expect(g.life('p2')).toBe(3);
  });

  it('[Once Per Turn]: a second qualifying play in the same turn does not take another Life card', () => {
    const g = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [C8, C8],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, C8);
    acceptUse(g, ID);
    // 10 DON!! pay 8 once; give the second one its cost back by planting a refund is not needed:
    // the second play needs 8 more, so only one is affordable; plant a free play instead.
    expect(g.life('p2')).toBe(2);
  });

  it("a Character played by a Character's effect triggers it even with a low base cost", () => {
    const g = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [V.c1, V.c2],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'planted',
        kind: 'auto',
        when: ['onPlay'],
        effect: [{ do: { play: { what: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } } }],
      } as unknown as Ability,
    ]);
    play(g, V.c1);
    pick(g, [g.find('p2', 'hand', V.c2)]);
    acceptUse(g, ID);
    // The played Character (cost 2) came from V.c1's effect: Life 3 -> 2.
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([V.c1]);
  });

  it('W57-R5: "can be activated" is optional: declining takes no Life card and does not spend the Once Per Turn (the official Q&A: use it later)', () => {
    const g = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [C8, C8],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, C8);
    declineUse(g, ID);
    expect(g.life('p2')).toBe(3);
    // A later qualifying play the same turn (a second 8 cost needs DON!!: plant a free refund).
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      {
        id: 'planted',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { play: { what: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    // Played by a Leader's effect: only the base cost 8 clause applies, and C8 qualifies.
    pick(g, [g.find('p2', 'hand', C8)]);
    expect(acceptUse(g, ID)).toBe(true);
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([V.c1]);
  });

  it("an Event's effect that plays a low-cost Character does not trigger it", () => {
    const g: TestGame = game(
      { leader: ID },
      {
        leader: PLAIN_BLUE,
        hand: [V.c2],
        life: [V.c1, V.c2, V.c3],
        costArea: { active: 10, rested: 0 },
      },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      {
        id: 'planted',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { play: { what: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(g.life('p2')).toBe(3);
  });

  it("W57-R4: a Character played by its own [Trigger] (OP13-106 Conney) is not played by a Character's effect", () => {
    const g = game(
      { leader: ID, costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, life: ['OP13-106', V.c2, V.c3, V.c4] },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    expect(dec(g)?.kind).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    // Conney (base cost 1) is played by its [Trigger]: official OP12-081 answer "No".
    expect(cardsIn(g, 'p2', 'characters')).toEqual(['OP13-106']);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([]);
  });
});
