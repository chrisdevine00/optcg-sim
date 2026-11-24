/** OP16-048 Buggy (Blue, cost 5). */
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
  play,
  takeDamage,
  V,
} from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER, mine, PRISONER } from './helpers-op16g2.ts';

const ID = 'OP16-048';

describe('OP16-048 Buggy', () => {
  it('[On Play] with an {Impel Down} Leader: draws 1 and plays up to 1 [Prisoner of Impel Down] from your hand', () => {
    const g = mine({ hand: [ID, PRISONER, V.c1], deck: [BLUE, BLUE] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, PRISONER].sort());
    expect(hand(g, 'p1')).toEqual([V.c1, BLUE]); // drew 1
  });

  it('draws even when there is no [Prisoner of Impel Down] to play', () => {
    const g = mine({ hand: [ID], deck: [BLUE, BLUE] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('without an {Impel Down} Leader nothing happens', () => {
    const g = game(
      {
        leader: BLUE_LEADER,
        hand: [ID, PRISONER],
        costArea: { active: 10, rested: 0 },
        deck: [BLUE],
      },
      { leader: BLUE_LEADER },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([PRISONER]);
  });

  const defend = (chars: string[]) => {
    const g = game(
      { leader: IMPEL_LEADER, characters: chars },
      { leader: BLUE_LEADER, characters: [V.c6, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    return g;
  };

  it("[On Your Opponent's Attack] up to 1 of your [Prisoner of Impel Down] cards gains [Blocker] during this turn", () => {
    const g = defend([ID, PRISONER]);
    pick(g, [g.find('p1', 'characters', PRISONER)]);
    const prisoner = g.find('p1', 'characters', PRISONER);
    expect(g.card(prisoner).keywords).toContain('Blocker');
    expectDecision(g, 'block', 'p1');
    expect(g.isLegal({ type: 'block', blocker: prisoner, player: 'p1' })).toBe(true);
  });

  it('is Once Per Turn: the next attack of the turn does not offer it again', () => {
    const g = defend([ID, PRISONER]);
    pick(g, [g.find('p1', 'characters', PRISONER)]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    expect(dec(g)?.kind).toBe('block');
  });

  it('without a [Prisoner of Impel Down] on the field there is nothing to give [Blocker] to', () => {
    const g = defend([ID]);
    expectDecision(g, 'block', 'p1');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });
});
