/** OP17-049 Charlotte Linlin. QA-OP17 OP17-049 (three rows). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  option,
  pick,
  play,
  PLAIN_PURPLE,
  PURPLE,
  ROCKS,
  trash,
  V,
} from './helpers.ts';

describe('OP17-049 Charlotte Linlin', () => {
  const onPlay = (oppHand: string[]) => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-049'], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_PURPLE, hand: oppHand },
    );
    play(g, 'OP17-049');
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.purpose).toBe('mode');
    expect(d.options).toHaveLength(2);
    return g;
  };

  it('the opponent chooses; "Draw 2 cards" makes the Linlin player draw', () => {
    const g = onPlay([PURPLE, PURPLE]);
    option(g, '0');
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(hand(g, 'p2')).toHaveLength(2);
    expect(g.eventsOfType('ModeChosen').at(-1)).toMatchObject({ mode: 0, player: 'p2' });
  });

  it('"trashes 2": the opponent chooses 2 cards from their own hand', () => {
    const g = onPlay([PURPLE, V.c1, V.c2]);
    option(g, '1');
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c2)]);
    expect(hand(g, 'p2')).toEqual([PURPLE]);
    expect(trash(g, 'p2').sort()).toEqual([V.c1, V.c2].sort());
  });

  it('QA: with 1 card the trash mode may be chosen and trashes it; with 0 nothing happens', () => {
    const one = onPlay([PURPLE]);
    option(one, '1');
    if (dec(one)?.kind === 'choose') pick(one, [one.find('p2', 'hand', PURPLE)]);
    expect(hand(one, 'p2')).toEqual([]);
    const zero = onPlay([]);
    option(zero, '1');
    if (dec(zero)?.kind === 'choose' && dec(zero)?.player === 'p2') zero.act({ type: 'done' });
    expectDecision(zero, 'main', 'p1');
  });

  it("[On Your Opponent's Attack] trash 1: +1000 during this battle", () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-049'], hand: [BLUE] },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
