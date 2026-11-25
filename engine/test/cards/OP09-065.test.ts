/** OP09-065 Sanji. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  decline,
  don,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  V,
} from './helpers.ts';
import { canPick, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-065';
const start = (opp: string[] = [V.c6]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 10, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );
const canAttack = (g: ReturnType<typeof start>) =>
  g.isLegal({
    type: 'attack',
    attacker: g.find('p1', 'characters', ID),
    target: g.leader('p2'),
    player: 'p1',
  });

describe('OP09-065 Sanji', () => {
  it('[On Play] returning DON!!: gains [Rush] this turn, then rests up to 1 opposing Character with cost 6 or less', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 1);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(canAttack(g)).toBe(true);
    expect(don(g, 'p1').deck).toBe(1);
    expect(dec(g)?.kind).toBe('main');
  });

  it('boundary: cost 6 can be rested, cost 7 and the Leader cannot', () => {
    const g = start([V.c6, V.c7]);
    play(g, ID);
    payReturn(g, 1);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": nothing may be rested, and [Rush] was still granted first', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 1);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('declining the cost: no [Rush], nothing rested and no question', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expect(canAttack(g)).toBe(false);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('with no opposing Character that qualifies, the effect only grants [Rush]', () => {
    const g = start([V.c7]);
    play(g, ID);
    payReturn(g, 1);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(false);
  });
});
