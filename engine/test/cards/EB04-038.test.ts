/** EB04-038 Rosinante & Law. */
import { describe, expect, it } from 'vitest';
import { addMost, BLUE, don, game, hand, PLAIN_BLUE, play } from './helpers.ts';
import { LAW5, ROSI } from './helpers-hancock-rosi.ts';

describe('EB04-038 Rosinante & Law', () => {
  const start = (theirs: number) => {
    const g = game(
      {
        leader: ROSI,
        hand: ['EB04-038'],
        deck: [BLUE, BLUE],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE, costArea: { active: theirs, rested: 0 } },
    );
    play(g, 'EB04-038');
    return g;
  };

  it('has [Blocker]', () => {
    const g = start(0);
    expect(g.card(g.find('p1', 'characters', 'EB04-038')).keywords).toContain('Blocker');
  });

  it('[On Play] with no more DON!! than your opponent: draws 1, then adds 1 DON!! as active', () => {
    const g = start(6);
    addMost(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6, deck: 3 });
  });

  it('applies when you have fewer', () => {
    const g = start(9);
    addMost(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').active).toBe(1);
  });

  it('does nothing when your opponent has fewer DON!! on the field (the "Then" is gated too)', () => {
    const g = start(5);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
  });

  it('counts DON!! given to cards as on the field', () => {
    // 6 rested after the play, 1 given to the Leader: 7 on the field against 6.
    const g = game(
      {
        leader: { card: ROSI, don: 1 },
        hand: ['EB04-038'],
        deck: [BLUE],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE, costArea: { active: 6, rested: 0 } },
    );
    play(g, 'EB04-038');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('is also named [Trafalgar Law] and [Donquixote Rosinante] (rules.alsoNamed)', () => {
    const g = game(
      {
        leader: ROSI,
        deck: [LAW5, 'EB04-038', BLUE],
        hand: ['OP12-108'],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP12-108');
    // Rosinante's [On Play] finds the Rosinante & Law card when searching for [Trafalgar Law].
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
  });
});
