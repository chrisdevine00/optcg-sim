/** OP18-023 Gaimon. */
import { describe, expect, it } from 'vitest';
import { none, pick, play } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { ALA2, EB1, EB_L, mk, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-023';
const banish = (g: ReturnType<typeof mk>, id: string) =>
  g.card(id).keywords.includes('Banish' as never);

describe('OP18-023 Gaimon', () => {
  it('[On Play] up to 1 {East Blue} Leader gains [Banish] this turn', () => {
    const g = mk({ leader: EB_L, hand: [ID] });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(banish(g, g.leader('p1'))).toBe(true);
  });

  it('or an {East Blue} Character; a Character of another type is not a candidate', () => {
    const g = mk({ leader: EB_L, hand: [ID], characters: [EB1, ALA2] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', EB1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true); // Gaimon is {East Blue}
    expect(canPick(g, g.find('p1', 'characters', ALA2))).toBe(false);
    pick(g, [g.find('p1', 'characters', EB1)]);
    expect(banish(g, g.find('p1', 'characters', EB1))).toBe(true);
  });

  it('a Leader that is not {East Blue} is not a candidate', () => {
    const g = mk({ leader: PLAIN_PURPLE, hand: [ID] });
    play(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(false);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ leader: EB_L, hand: [ID] });
    play(g, ID);
    none(g);
    expect(banish(g, g.leader('p1'))).toBe(false);
  });

  it("[Banish] lasts only this turn, and the opponent's {East Blue} cards are not candidates", () => {
    const g = mk({ leader: EB_L, hand: [ID] }, { leader: EB_L, characters: [EB1] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', EB1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(banish(g, g.leader('p1'))).toBe(false);
  });
});
