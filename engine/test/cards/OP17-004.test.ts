/** OP17-004 Inuarashi & Nekomamushi. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAttack, DOMA, RED_LEADER, ROCKSTAR, SHINOBU } from './helpers-op17g1.ts';

const ID = 'OP17-004';

describe('OP17-004 Inuarashi & Nekomamushi', () => {
  const start = (chars: Parameters<typeof game>[0]['characters']) =>
    game(
      { leader: RED_LEADER, hand: [ID], characters: chars, costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
  const fresh = (card: string) => ({ card, playedThisTurn: true });

  it('[On Play] gives a {Land of Wano} Character [Rush] this turn', () => {
    const g = start([fresh(SHINOBU)]);
    play(g, ID);
    const shinobu = g.find('p1', 'characters', SHINOBU);
    expect(canAttack(g, shinobu, g.leader('p2'))).toBe(false);
    pick(g, [shinobu]);
    expect(g.card(shinobu).keywords).toContain('Rush');
    expect(canAttack(g, shinobu, g.leader('p2'))).toBe(true);
  });

  it('gives [Rush] to a Character with a type including "Whitebeard Pirates" (a substring: {Whitebeard Pirates Allies})', () => {
    const g = start([fresh(DOMA)]);
    play(g, ID);
    const doma = g.find('p1', 'characters', DOMA);
    pick(g, [doma]);
    expect(canAttack(g, doma, g.leader('p2'))).toBe(true);
  });

  it('a Character of neither kind is not a candidate; this Character ({Land of Wano}) can pick itself', () => {
    const g = start([fresh(ROCKSTAR)]);
    play(g, ID);
    const candidates = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(candidates).toEqual([g.find('p1', 'characters', ID)]);
  });

  it('"up to 1": it may give [Rush] to nobody, and only one Character gets it', () => {
    const g = start([fresh(SHINOBU), fresh(DOMA)]);
    play(g, ID);
    none(g);
    expect(g.card(g.find('p1', 'characters', SHINOBU)).keywords).not.toContain('Rush');
    expectDecision(g, 'main', 'p1');
    const g2 = start([fresh(SHINOBU), fresh(DOMA)]);
    play(g2, ID);
    pick(g2, [g2.find('p1', 'characters', DOMA)]);
    expect(g2.card(g2.find('p1', 'characters', SHINOBU)).keywords).not.toContain('Rush');
  });

  it('[Rush] lasts this turn only', () => {
    const g = start([fresh(SHINOBU)]);
    play(g, ID);
    const shinobu = g.find('p1', 'characters', SHINOBU);
    pick(g, [shinobu]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(shinobu).keywords).not.toContain('Rush');
    void V;
  });
});
