/** OP15-067 Shura. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, don, game, hand, payDon, play } from './helpers.ts';
import { ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-067 Shura', () => {
  const canAttack = (g: ReturnType<typeof game>, id: string) =>
    g.isLegal({ type: 'attack', attacker: id, target: g.leader('p2'), player: 'p1' });

  it('gains [Rush] while you have 6 or less DON!! on your field', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-067'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    const id = play(g, 'OP15-067');
    decline(g);
    expect(canAttack(g, id)).toBe(true);
  });

  it('has no [Rush] with 7 or more DON!! on your field', () => {
    const g = game(
      { leader: 'ST05-001', hand: ['OP15-067'], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    const id = play(g, 'OP15-067');
    decline(g);
    expect(canAttack(g, id)).toBe(false);
  });

  it('[On Play] DON!! -1: draws 1 card', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-067'], costArea: { active: 3, rested: 0 }, donDeck: 3 },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP15-067');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('[Rush] follows the count: paying DON!! -1 brings 7 down to 6 and the Rush appears', () => {
    const g = game(
      { leader: 'ST05-001', hand: ['OP15-067'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    const id = play(g, 'OP15-067');
    expect(g.card(id).keywords).not.toContain('Rush'); // 7 on the field while the [On Play] is pending
    accept(g);
    payDon(g);
    expect(g.card(id).keywords).toContain('Rush'); // 6 after the DON!! -1
    expect(canAttack(g, id)).toBe(true);
  });
});
