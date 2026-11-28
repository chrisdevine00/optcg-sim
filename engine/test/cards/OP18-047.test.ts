/** OP18-047 Mr.1(Daz.Bonez). */
import { describe, expect, it } from 'vitest';
import { game, play } from './helpers.ts';
import { BW_L, PLAIN_BLUE, PLAIN_PURPLE } from './helpers-op18-g2.ts';

const ID = 'OP18-047';
const CG_L = 'OP09-042';
const played = (leader: string) => {
  const g = game(
    { leader, hand: [ID], costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe('OP18-047 Mr.1(Daz.Bonez)', () => {
  it('[On Play] a {Baroque Works} Leader gains [Unblockable] this turn', () => {
    const g = played(BW_L);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
  });

  it('a {Cross Guild} Leader gains it too', () => {
    const g = played(CG_L);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
  });

  it('a Leader of another type gains nothing', () => {
    const g = played(PLAIN_PURPLE);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
  });

  it('it lasts this turn only', () => {
    const g = played(BW_L);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
  });

  it('Mr.1 himself does not gain it', () => {
    const g = played(BW_L);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Unblockable');
  });
});
